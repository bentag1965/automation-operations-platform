# Incident Scenario: Queue Backlog Is Growing

## Symptoms

- queue depth rises continuously
- oldest queued item age increases
- external API latency may also be elevated

## Response

1. identify which workflow type or adapter dominates backlog growth
2. check external dependency health
3. confirm retry behavior is not amplifying load
4. reduce concurrency if downstream throttling is occurring
5. pause low-priority intake if backlog threatens SLA
6. inspect dead-letter and terminal-failure counts
7. verify state transitions remain consistent

## Important Principle

A growing queue is a symptom. Increasing worker concurrency without checking the dependency can make the incident worse.
