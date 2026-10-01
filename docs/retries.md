# Retry Strategy

Retries should be deliberate rather than automatic for every failure.

## Retryable Examples

- HTTP 429
- HTTP 502/503/504
- network timeout
- connection reset
- temporary DNS failure

## Usually Non-Retryable

- malformed input
- authentication failure caused by invalid credentials
- permission denied
- business-rule rejection
- resource not found when it is expected to be permanently absent

## Bounded Exponential Backoff

A simple policy:

```text
delay = min(base * 2^attempt, maximum_delay)
```

Add jitter in production systems to avoid synchronized retry storms.

## Dead Letter

After the maximum attempt count, transition the work item to a terminal review state rather than retrying forever.

Store:

- final error
- number of attempts
- last provider response
- timestamps
- correlation/workflow ID
