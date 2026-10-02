# Local End-to-End Demo

This repository includes a runnable local stack using Docker Compose.

## Services

- **PostgreSQL** — durable workflow state and audit records
- **API** — webhook intake, workflow lookup, approvals, health, and metrics
- **Worker** — claims queued work, executes the adapter, retries transient failures, and moves exhausted work to dead letter

## Start

```powershell
docker compose up -d --build
```

Check container state:

```powershell
docker compose ps
```

Expected services:

```text
api
db
worker
```

## Health Check

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected:

```text
status database
------ --------
ok     reachable
```

## Success Path

Submit a normal workflow:

```powershell
$body = @{
    source = "portfolio-demo"
    eventId = "demo-event-001"
    eventType = "demo.process"
    approvalRequired = $false
    payload = @{
        message = "Hello from the local workflow demo"
    }
} | ConvertTo-Json -Depth 5

$result = Invoke-RestMethod `
    -Uri http://localhost:3000/webhooks/example `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

The worker moves the workflow through:

```text
received
→ validated
→ queued
→ processing
→ succeeded
```

Submitting the same `eventId` again returns the existing workflow rather than creating duplicate work.

## Approval Path

Set:

```text
approvalRequired = true
```

The workflow pauses at:

```text
awaiting_approval
```

Approve with:

```powershell
$approveBody = @{
    decidedBy = "Local Operator"
    note = "Approved during local validation"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:3000/workflows/<workflow-id>/approve" `
    -Method Post `
    -ContentType "application/json" `
    -Body $approveBody
```

The worker then resumes:

```text
awaiting_approval
→ queued
→ processing
→ succeeded
```

## Retry and Dead-Letter Path

Submit a payload containing:

```json
{
  "failMode": "transient"
}
```

The mock adapter intentionally fails. The worker applies bounded exponential backoff until the configured attempt limit is exhausted.

Lifecycle:

```text
queued
→ processing
→ retry_scheduled
→ processing
→ retry_scheduled
...
→ dead_letter
```

## Metrics

```powershell
Invoke-WebRequest http://localhost:3000/metrics |
    Select-Object -ExpandProperty Content
```

Validated example:

```text
# HELP workflow_count Current workflows by status.
# TYPE workflow_count gauge
workflow_count{status="dead_letter"} 1
workflow_count{status="succeeded"} 2
```

## What This Demonstrates

The local reference stack has been manually validated for:

- database connectivity
- webhook intake
- durable workflow state
- idempotent duplicate handling
- worker claims
- successful adapter execution
- explicit human approval
- bounded retries
- dead-letter handling
- audit history
- Prometheus-style workflow metrics
