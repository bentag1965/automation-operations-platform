import crypto from "node:crypto";
import type { PoolClient } from "pg";
import { pool, withTransaction } from "./db";

export interface CreateWorkflowInput {
  source: string;
  eventType: string;
  eventId?: string;
  objectId?: string;
  approvalRequired?: boolean;
  payload: Record<string, unknown>;
}

export function buildIdempotencyKey(input: CreateWorkflowInput): string {
  const stable = input.eventId ??
    [input.source, input.objectId ?? "none", input.eventType].join(":");
  return crypto.createHash("sha256").update(stable).digest("hex");
}

async function addEvent(
  client: PoolClient,
  workflowId: string,
  eventType: string,
  fromStatus: string | null,
  toStatus: string | null,
  metadata: Record<string, unknown> = {}
) {
  await client.query(
    `insert into workflow_events
      (workflow_id, event_type, from_status, to_status, metadata)
     values ($1,$2,$3,$4,$5::jsonb)`,
    [workflowId, eventType, fromStatus, toStatus, JSON.stringify(metadata)]
  );
}

export async function createOrGetWorkflow(input: CreateWorkflowInput) {
  const idempotencyKey = buildIdempotencyKey(input);

  return withTransaction(async (client) => {
    const existing = await client.query(
      "select * from workflows where idempotency_key = $1",
      [idempotencyKey]
    );

    if (existing.rows[0]) {
      return { workflow: existing.rows[0], duplicate: true };
    }

    const initialStatus = input.approvalRequired
      ? "awaiting_approval"
      : "queued";

    const inserted = await client.query(
      `insert into workflows
        (idempotency_key, workflow_type, source, status, payload, approval_required)
       values ($1,$2,$3,$4,$5::jsonb,$6)
       returning *`,
      [
        idempotencyKey,
        input.eventType,
        input.source,
        initialStatus,
        JSON.stringify(input.payload),
        Boolean(input.approvalRequired),
      ]
    );

    const workflow = inserted.rows[0];

    await addEvent(client, workflow.id, "received", null, "received");
    await addEvent(client, workflow.id, "validated", "received", "validated");
    await addEvent(
      client,
      workflow.id,
      input.approvalRequired ? "approval_required" : "queued",
      "validated",
      initialStatus
    );

    if (input.approvalRequired) {
      await client.query(
        "insert into approvals (workflow_id,status) values ($1,'pending')",
        [workflow.id]
      );
    }

    return { workflow, duplicate: false };
  });
}

export async function getWorkflow(id: string) {
  const workflow = await pool.query(
    "select * from workflows where id = $1",
    [id]
  );
  if (!workflow.rows[0]) return null;

  const events = await pool.query(
    "select * from workflow_events where workflow_id = $1 order by created_at",
    [id]
  );

  const approvals = await pool.query(
    "select * from approvals where workflow_id = $1 order by requested_at",
    [id]
  );

  return {
    ...workflow.rows[0],
    events: events.rows,
    approvals: approvals.rows,
  };
}

export async function approveWorkflow(
  id: string,
  decidedBy: string,
  note?: string
) {
  return withTransaction(async (client) => {
    const current = await client.query(
      "select * from workflows where id = $1 for update",
      [id]
    );

    const workflow = current.rows[0];
    if (!workflow) return null;
    if (workflow.status !== "awaiting_approval") return workflow;

    await client.query(
      `update approvals
       set status='approved', decided_at=now(), decided_by=$2, note=$3
       where workflow_id=$1 and status='pending'`,
      [id, decidedBy, note ?? null]
    );

    const updated = await client.query(
      "update workflows set status='queued', updated_at=now() where id=$1 returning *",
      [id]
    );

    await addEvent(client, id, "approved", "awaiting_approval", "queued", {
      decidedBy,
    });

    return updated.rows[0];
  });
}
