import express from "express";
import { pool } from "./db";
import {
  approveWorkflow,
  createOrGetWorkflow,
  getWorkflow,
} from "./repository";

const app = express();
app.use(express.json({ limit: "256kb" }));

app.get("/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ status: "ok", database: "reachable" });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      database: "unreachable",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/webhooks/example", async (req, res) => {
  const body = req.body as Record<string, unknown>;

  if (!body.source || !body.eventType || !body.payload) {
    res.status(400).json({
      error: "source, eventType, and payload are required",
    });
    return;
  }

  const result = await createOrGetWorkflow({
    source: String(body.source),
    eventType: String(body.eventType),
    eventId: body.eventId ? String(body.eventId) : undefined,
    objectId: body.objectId ? String(body.objectId) : undefined,
    approvalRequired: Boolean(body.approvalRequired),
    payload: body.payload as Record<string, unknown>,
  });

  res.status(result.duplicate ? 200 : 202).json({
    duplicate: result.duplicate,
    workflowId: result.workflow.id,
    status: result.workflow.status,
  });
});

app.get("/workflows/:id", async (req, res) => {
  const workflow = await getWorkflow(req.params.id);
  if (!workflow) {
    res.status(404).json({ error: "workflow not found" });
    return;
  }
  res.json(workflow);
});

app.post("/workflows/:id/approve", async (req, res) => {
  const decidedBy = String(req.body?.decidedBy ?? "local-operator");
  const workflow = await approveWorkflow(
    req.params.id,
    decidedBy,
    req.body?.note ? String(req.body.note) : undefined
  );

  if (!workflow) {
    res.status(404).json({ error: "workflow not found" });
    return;
  }

  res.json({ workflowId: workflow.id, status: workflow.status });
});

app.get("/metrics", async (_req, res) => {
  const counts = await pool.query(
    "select status, count(*)::int as count from workflows group by status order by status"
  );

  const totals = await pool.query(
    `select
       count(*)::int as total,
       count(*) filter (where status='queued')::int as queued,
       count(*) filter (where status='processing')::int as processing,
       count(*) filter (where status='retry_scheduled')::int as retry_scheduled,
       count(*) filter (where status='dead_letter')::int as dead_letter,
       count(*) filter (where status='awaiting_approval')::int as awaiting_approval,
       coalesce(avg(extract(epoch from (completed_at-created_at)))
         filter (where completed_at is not null),0)::float as avg_completion_seconds,
       coalesce(max(extract(epoch from (now()-created_at)))
         filter (where status='queued'),0)::float as oldest_queued_age_seconds
     from workflows`
  );

  const retryEvents = await pool.query(
    `select count(*)::int as count
     from workflow_events
     where to_status='retry_scheduled'`
  );

  const approvalWait = await pool.query(
    `select coalesce(avg(extract(epoch from (decided_at-requested_at)))
      filter (where decided_at is not null),0)::float as avg_approval_wait_seconds
     from approvals`
  );

  const adapterLatency = await pool.query(
    `select coalesce(avg(
       extract(epoch from (
         succeeded.created_at - claimed.created_at
       ))
     ),0)::float as avg_adapter_latency_seconds
     from workflow_events claimed
     join workflow_events succeeded
       on succeeded.workflow_id = claimed.workflow_id
      and succeeded.event_type = 'adapter_succeeded'
     where claimed.event_type = 'worker_claimed'`
  );

  const summary = totals.rows[0];
  const metrics = [
    "# HELP workflow_count Current workflows by status.",
    "# TYPE workflow_count gauge",
    ...counts.rows.map(
      (row) => `workflow_count{status="${row.status}"} ${row.count}`
    ),
    "# HELP workflow_total Total workflows.",
    "# TYPE workflow_total gauge",
    `workflow_total ${summary.total}`,
    "# HELP workflow_queue_depth Current queued workflows.",
    "# TYPE workflow_queue_depth gauge",
    `workflow_queue_depth ${summary.queued}`,
    "# HELP workflow_processing Current processing workflows.",
    "# TYPE workflow_processing gauge",
    `workflow_processing ${summary.processing}`,
    "# HELP workflow_retry_scheduled Current workflows waiting for retry.",
    "# TYPE workflow_retry_scheduled gauge",
    `workflow_retry_scheduled ${summary.retry_scheduled}`,
    "# HELP workflow_dead_letter Current dead-letter workflows.",
    "# TYPE workflow_dead_letter gauge",
    `workflow_dead_letter ${summary.dead_letter}`,
    "# HELP workflow_awaiting_approval Current workflows awaiting approval.",
    "# TYPE workflow_awaiting_approval gauge",
    `workflow_awaiting_approval ${summary.awaiting_approval}`,
    "# HELP workflow_retry_events_total Total retry scheduling events.",
    "# TYPE workflow_retry_events_total counter",
    `workflow_retry_events_total ${retryEvents.rows[0].count}`,
    "# HELP workflow_avg_completion_seconds Average completed workflow duration.",
    "# TYPE workflow_avg_completion_seconds gauge",
    `workflow_avg_completion_seconds ${summary.avg_completion_seconds}`,
    "# HELP workflow_oldest_queued_age_seconds Age of oldest queued workflow.",
    "# TYPE workflow_oldest_queued_age_seconds gauge",
    `workflow_oldest_queued_age_seconds ${summary.oldest_queued_age_seconds}`,
    "# HELP workflow_avg_approval_wait_seconds Average approval wait time.",
    "# TYPE workflow_avg_approval_wait_seconds gauge",
    `workflow_avg_approval_wait_seconds ${approvalWait.rows[0].avg_approval_wait_seconds}`,
    "# HELP workflow_avg_adapter_latency_seconds Average worker adapter execution latency.",
    "# TYPE workflow_avg_adapter_latency_seconds gauge",
    `workflow_avg_adapter_latency_seconds ${adapterLatency.rows[0].avg_adapter_latency_seconds}`,
  ];

  res.type("text/plain").send(metrics.join("\n") + "\n");
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
