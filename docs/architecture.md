# Architecture

## Goal

Operational automation becomes fragile when inbound events, business state, third-party APIs, retries, and human decisions are blended together.

This reference architecture separates those concerns so a workflow can survive duplicate events, provider outages, manual approvals, and partial failure.

## Layers

### Ingress
Responsible for:

- authenticating the caller
- validating payload shape
- extracting an idempotency key
- normalizing inbound data
- creating or returning a workflow record

Ingress should acknowledge accepted work quickly rather than block on a long-running external API call.

### Workflow Store
The source of truth for operational state.

It records:

- current status
- normalized payload
- attempt count
- approval requirement
- next retry time
- result
- terminal error
- timestamps

### Queue
Separates acceptance of work from execution.

The queue protects upstream callers from downstream latency and provides a controlled place for retries.

### Worker
Claims queued work, transitions state, applies business rules, and invokes an adapter.

### Adapter Layer
Keeps third-party implementation details out of workflow orchestration.

Adapters should translate:

```text
internal command → provider-specific request
provider-specific response → normalized result
```

### Approval Gate
Certain operations should not execute automatically.

Examples include:

- destructive changes
- external publishing
- high-value transactions
- production configuration changes

Approval state belongs in the same durable workflow record.

### Audit Trail
Audit events record meaningful transitions and decisions independently of application logs.

## Failure Domains

A useful design separates:

- invalid input
- duplicate input
- transient provider failure
- rate limiting
- permanent provider rejection
- approval rejection
- internal execution error

Those categories should not all share the same retry policy.
