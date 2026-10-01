# Observability and Service Signals

## Operational Goal

Every accepted workflow should be explainable: where it is, how long it has been there, and why it has not completed.

## Key Signals

| Signal | Why it matters |
|---|---|
| workflows by state | shows system pressure and stuck stages |
| queue depth | primary backlog signal |
| oldest queued item age | catches starvation even when depth is low |
| retry count | indicates dependency instability |
| dead-letter volume | exposes terminal failures requiring review |
| approval wait time | measures human bottlenecks |
| external API latency | detects dependency degradation |
| end-to-end completion time | measures user-visible operational performance |

## Suggested Service Objectives

- 99% of accepted low-risk workflows reach a terminal state within 15 minutes
- 99.9% of duplicate webhook deliveries do not create duplicate side effects
- 100% of terminal failures retain error context
- 100% of approval-required workflows record the decision actor and timestamp

## Alert Conditions

- queue depth increasing continuously for 15 minutes
- oldest queued item exceeds expected SLA
- retry rate spikes above normal baseline
- dead-letter count increases
- approval queue exceeds agreed age
- one external adapter error rate diverges sharply from others
