# ADR-001: Use durable workflow state

**Status:** Accepted

## Context

Webhook and API automations can fail partially: an external API may time out after performing an action, approvals may arrive later, and retries can occur after process restarts. Relying only on logs or in-memory control flow makes recovery ambiguous.

## Decision

Persist workflow state and meaningful transitions in durable storage. Treat the workflow store as the source of truth for progress.

## Consequences

### Positive

- work can resume after restarts
- retry and approval behavior is explicit
- operations can be reconstructed from history
- duplicate events can map back to existing workflow records

### Tradeoffs

- more schema and transition logic
- invalid transitions must be prevented
- retention policy is needed over time
