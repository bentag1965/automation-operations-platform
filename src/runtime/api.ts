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
  const metrics = [
    "# HELP workflow_count Current workflows by status.",
    "# TYPE workflow_count gauge",
    ...counts.rows.map(
      (row) => `workflow_count{status="${row.status}"} ${row.count}`
    ),
  ];
  res.type("text/plain").send(metrics.join("\n") + "\n");
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
