import { pool, withTransaction } from "./db";
import { calculateBackoffSeconds } from "../queue/dispatcher";
import { MockIntegrationAdapter } from "../adapters/mock-adapter";

const pollMs = Number(process.env.WORKER_POLL_MS ?? 2000);
const adapter = new MockIntegrationAdapter();

async function claimNext() {
  return withTransaction(async (client) => {
    const selected = await client.query(
      `select *
       from workflows
       where status in ('queued','retry_scheduled')
         and (next_attempt_at is null or next_attempt_at <= now())
       order by created_at
       for update skip locked
       limit 1`
    );

    const workflow = selected.rows[0];
    if (!workflow) return null;

    await client.query(
      `update workflows
       set status='processing',
           attempt_count=attempt_count+1,
           updated_at=now()
       where id=$1`,
      [workflow.id]
    );

    await client.query(
      `insert into workflow_events
       (workflow_id,event_type,from_status,to_status,metadata)
       values ($1,'worker_claimed',$2,'processing',$3::jsonb)`,
      [
        workflow.id,
        workflow.status,
        JSON.stringify({ attempt: workflow.attempt_count + 1 }),
      ]
    );

    return {
      ...workflow,
      attempt_count: workflow.attempt_count + 1,
      status: "processing",
    };
  });
}

async function succeed(id: string, result: unknown) {
  await withTransaction(async (client) => {
    await client.query(
      `update workflows
       set status='succeeded',
           result=$2::jsonb,
           completed_at=now(),
           updated_at=now(),
           last_error_code=null,
           last_error_message=null
       where id=$1`,
      [id, JSON.stringify(result)]
    );
    await client.query(
      `insert into workflow_events
       (workflow_id,event_type,from_status,to_status,metadata)
       values ($1,'adapter_succeeded','processing','succeeded',$2::jsonb)`,
      [id, JSON.stringify({ result })]
    );
  });
}

async function fail(workflow: any, error: Error) {
  const transient = /transient/i.test(error.message);
  const exhausted = workflow.attempt_count >= workflow.max_attempts;
  const nextStatus = transient && !exhausted
    ? "retry_scheduled"
    : exhausted
      ? "dead_letter"
      : "failed";

  const backoff = calculateBackoffSeconds(workflow.attempt_count);

  await withTransaction(async (client) => {
    await client.query(
      `update workflows
       set status=$2,
           next_attempt_at=case when $2='retry_scheduled'
             then now() + ($3 || ' seconds')::interval
             else null end,
           last_error_code=$4,
           last_error_message=$5,
           updated_at=now()
       where id=$1`,
      [workflow.id, nextStatus, String(backoff), transient ? "TRANSIENT" : "PERMANENT", error.message]
    );

    await client.query(
      `insert into workflow_events
       (workflow_id,event_type,from_status,to_status,metadata)
       values ($1,'adapter_failed','processing',$2,$3::jsonb)`,
      [
        workflow.id,
        nextStatus,
        JSON.stringify({
          error: error.message,
          retryInSeconds: nextStatus === "retry_scheduled" ? backoff : null,
        }),
      ]
    );
  });
}

async function tick() {
  const workflow = await claimNext();
  if (!workflow) return;

  try {
    const result = await adapter.execute(workflow.payload);
    await succeed(workflow.id, result);
  } catch (error) {
    await fail(
      workflow,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

async function loop() {
  console.log(`Worker polling every ${pollMs}ms`);
  for (;;) {
    try {
      await tick();
    } catch (error) {
      console.error("worker tick failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

void loop();
