# Idempotency

Webhooks and distributed systems deliver duplicates. A reliable automation platform assumes repetition will happen.

## Idempotency Key

An inbound event should provide or derive a stable key, for example:

```text
source + event_id
```

or:

```text
source + object_id + event_type + version
```

## Desired Behavior

When the same event arrives twice:

1. Look up the idempotency key.
2. If a workflow exists, return its existing identity/status.
3. Do not enqueue a second copy of the same logical work.

## Database Enforcement

Application checks are useful, but the database should enforce uniqueness as the final defense.

```sql
unique (idempotency_key)
```

## Scope

Idempotency protects against accidental duplicate execution. It does not replace authorization, concurrency control, or business validation.
