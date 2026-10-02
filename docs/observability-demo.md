# Local Observability Stack

The Docker Compose environment includes Prometheus and Grafana in addition to the API, worker, and PostgreSQL.

## Services

| Service | URL | Purpose |
|---|---|---|
| API | http://localhost:3000 | Workflow API |
| API metrics | http://localhost:3000/metrics | Raw Prometheus metrics |
| Prometheus | http://localhost:9090 | Metric collection/query |
| Grafana | http://localhost:3001 | Operations dashboard |

Grafana local credentials:

```text
username: admin
password: admin
```

These credentials are intentionally local-demo defaults and must not be reused for a real deployment.

## Start

```powershell
git pull
docker compose up -d --build
docker compose ps
```

The expected stack is:

```text
api
db
worker
prometheus
grafana
```

## Metrics

The API exposes:

- `workflow_count{status=...}`
- `workflow_total`
- `workflow_queue_depth`
- `workflow_processing`
- `workflow_retry_scheduled`
- `workflow_dead_letter`
- `workflow_awaiting_approval`
- `workflow_retry_events_total`
- `workflow_avg_completion_seconds`
- `workflow_oldest_queued_age_seconds`
- `workflow_avg_approval_wait_seconds`
- `workflow_avg_adapter_latency_seconds`

## Grafana Dashboard

A dashboard is provisioned automatically under:

```text
Automation Operations Platform
```

It includes:

- total workflows
- succeeded workflows
- dead-letter workflows
- awaiting approval
- workflow status over time
- queue depth
- retry events
- average completion time
- average approval wait
- average adapter latency

## Suggested Demo

Generate a small mix of:

- successful workflows
- approval-required workflows
- transient failures
- dead-letter outcomes

Then watch Grafana update every five seconds.

## Portfolio Purpose

This dashboard turns the system from a code sample into an operable reference application. It demonstrates that runtime behavior is measurable, visible, and tied to the workflow state model.

## Generate Demo Traffic

After the stack is running, create a repeatable mix of successful, approval-required, and transient-failure workflows:

```powershell
.\examples\Generate-DemoTraffic.ps1
```

Defaults:

- 8 successful workflows
- 2 approval-required workflows, automatically approved for the demo
- 2 transient-failure workflows that eventually exercise retry/dead-letter behavior

Override the mix if desired:

```powershell
.\examples\Generate-DemoTraffic.ps1 -SuccessCount 15 -ApprovalCount 4 -TransientFailureCount 3
```
