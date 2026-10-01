# Human Approval Gates

Some workflows should be automated up to the point where judgment or authorization is required.

## Pattern

```text
processing
   ↓
approval_required
   ↓
awaiting_approval
  ↙           ↘
approved     rejected
   ↓            ↓
queued       cancelled
```

## Approval Record

Preserve:

- workflow ID
- requested action
- request timestamp
- approver identity
- decision
- decision timestamp
- optional note

## Important Property

Approval should resume the same durable workflow rather than create a new unrelated execution path.

That preserves traceability from the original event through the final action.
