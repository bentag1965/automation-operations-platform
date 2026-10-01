# Reliability Boundaries and Recovery

## Principle

Operational failures should be classified because recovery depends on cause.

| Condition | Retry? | Typical response |
|---|---|---|
| validation error | No | reject and record |
| configuration error | Usually no | configuration review |
| rate limit | Yes | bounded backoff |
| transient network error | Yes | retry with delay |
| external service 5xx | Yes | bounded retry |
| permanent service rejection | No | terminal failure |
| duplicate event | No new work | return existing state |

## Recovery Principles

- never retry forever
- preserve enough evidence to explain terminal failure
- use stable correlation IDs
- prefer idempotent replay over manual repair
- surface dead-letter work for operator review
- keep successful work intact when another dependency fails
