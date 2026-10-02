# Validation Evidence

## Local Runtime Validation

The runnable reference stack has been exercised end-to-end using Docker Desktop on Windows with:

- Node.js runtime
- PostgreSQL 17
- API container
- background worker container

## Validated Behaviors

### Success

A submitted workflow reached `succeeded` after one worker attempt.

Observed transition history:

```text
received
validated
queued
worker_claimed → processing
adapter_succeeded → succeeded
```

### Idempotency

Re-submitting the same event identity returned the existing workflow with `duplicate=true` instead of creating another record.

### Human approval

An approval-required workflow remained at `awaiting_approval` with zero worker attempts until an operator approval was persisted.

After approval:

```text
awaiting_approval
→ approved
→ queued
→ processing
→ succeeded
```

The approval record retained:

- decision status
- decision time
- decision actor
- operator note

### Retry / Dead Letter

A mock transient dependency failure was allowed to retry with bounded backoff.

After reaching the configured maximum attempts, the workflow transitioned to:

```text
dead_letter
```

### Metrics

After validation, the live metrics endpoint reported:

```text
workflow_count{status="dead_letter"} 1
workflow_count{status="succeeded"} 2
```

## Why This Matters

This repository is no longer only a conceptual architecture. It has a runnable control path with durable state, worker execution, approval gating, bounded retry behavior, terminal failure handling, and operational metrics.
