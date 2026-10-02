# Incident Drill: Dependency Failure and Retry Pressure

This drill creates a repeatable failure condition in the local reference system.

It is designed for portfolio validation and operational practice.

## Goal

Validate the complete reliability path:

healthy -> dependency failure -> retry scheduled -> backoff -> retry exhaustion -> dead letter -> operator detection -> recovery verification

## Preconditions

Start the local stack:

```powershell
docker compose up -d --build
```

Confirm:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

## Inject Failure

Use the existing demo generator:

```powershell
.\examples\Generate-DemoTraffic.ps1 `
  -SuccessCount 3 `
  -ApprovalCount 0 `
  -TransientFailureCount 5
```

This creates a control group of successful workflows and a set of intentionally failing workflows.

## Observe

Open Grafana at `http://localhost:3001` and watch:

- Retry Events
- Dead Letter
- Success Ratio
- Queue Depth
- Retry Scheduled
- Oldest Queued Age

Open Prometheus at `http://localhost:9090/alerts` and confirm alert-rule state as thresholds are crossed.

## Triage Exercise

Answer these questions from the metrics and workflow history:

1. Is the queue currently growing?
2. Are workflows actively retrying or already terminal?
3. Is the problem isolated to one failure mode?
4. Is healthy work still succeeding?
5. Did any duplicate work appear?
6. Has retry pressure stopped?
7. Is any dead-letter work awaiting operator action?

## Recovery Test

Submit a normal workflow after the failure run:

```powershell
$body = @{
  source = "incident-drill"
  eventId = "recovery-$([DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds())"
  eventType = "recovery.validation"
  approvalRequired = $false
  payload = @{
    message = "Known-good recovery validation"
  }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod `
  -Uri "http://localhost:3000/webhooks/example" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

Then verify that the workflow reaches `succeeded`.

## Exit Criteria

The drill is complete when:

- new work succeeds
- queue depth returns to zero
- retry-scheduled returns to zero
- processing returns to zero
- dead-letter count is understood
- successful workflows remain intact
- audit history explains the failure path

## Follow-Up

- [Simulated incident postmortem](simulated-postmortem.md)
- [Incident runbook](runbook.md)
