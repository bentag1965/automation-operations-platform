# Incident Runbook

## Purpose

This runbook provides a repeatable first-response path for degraded behavior in the reference system.

The goal is not to solve every incident from a checklist. It is to reduce guesswork, preserve evidence, and restore safe service deliberately.

## First 10 Minutes

1. Confirm the impact and affected scope.
2. Identify the earliest known failure time.
3. Check current queue/backlog or pending work.
4. Check dependency health and recent error rates.
5. Confirm whether data is being lost, delayed, or duplicated.
6. Freeze risky changes while the incident is active.
7. Record a correlation ID, run ID, workflow ID, or event ID for a failing example.
8. Preserve logs and timestamps before restarting components.
9. Prefer reversible mitigation over broad configuration changes.
10. Confirm recovery with a known-good test case.

## Triage Questions

- Is the failure local or dependency-wide?
- Is work failing, delayed, or merely invisible?
- Are retries increasing load?
- Are duplicates being created?
- Is state durable across restart?
- Did a deployment or configuration change occur near the failure time?
- Is authentication or authorization involved?
- Is the issue isolated to one provider, model, gateway, or integration?

## Safe Mitigations

- pause new work intake when backlog growth threatens stability
- reduce concurrency
- disable one unhealthy dependency without discarding healthy results
- extend backoff during provider instability
- preserve pending durable work before restart
- route high-risk operations to manual approval

## Recovery Verification

Recovery is not complete until:

- new work succeeds
- previously queued work drains safely
- duplicate rate remains normal
- error rate returns to baseline
- no hidden dead-letter backlog remains
- audit/state records are internally consistent

## After the Incident

Capture:

- timeline
- impact
- trigger
- contributing conditions
- detection gap
- mitigation
- permanent corrective action
- follow-up owner
