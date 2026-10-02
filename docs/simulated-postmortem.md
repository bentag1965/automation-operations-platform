# Simulated Incident Postmortem: External Dependency Degradation

> Portfolio reliability exercise. This document describes a controlled failure injected into the local reference platform. It is not presented as a real customer or employer outage.

## Executive Summary

A simulated external integration degradation caused repeated transient failures in the workflow worker. The retry policy behaved as designed, but sustained failures caused retry pressure and eventually moved affected workflows into dead-letter state after retry exhaustion.

The exercise validated that:

- transient failures are classified and retried
- retry attempts are bounded
- dead-letter state is explicit
- workflow history preserves the failure path
- queue and retry behavior are observable
- operators can distinguish active backlog from terminal failure

The exercise also exposed an observability gap: the original dashboard showed the conditions, but Prometheus did not yet define alert rules for queue growth, aged work, retry pressure, dead-letter accumulation, or low success ratio.

Those alert rules were added as a corrective action.

## Impact

### Simulated user impact

Affected workflows were delayed while retries were attempted. Workflows that exhausted their retry budget did not complete automatically and required operator review.

### Data integrity

No duplicate work was introduced. No successfully completed workflow was rolled back or overwritten. Failed workflows retained their state and audit events.

### Scope

The incident was limited to workflows routed through the simulated failing adapter behavior. Healthy workflows continued to execute independently.

## Detection

The condition was visible through the Grafana dashboard:

- retry events increased
- dead-letter count increased
- success ratio decreased
- queue activity showed temporary spikes
- current processing and retry counts returned to zero after retry exhaustion

The exercise demonstrated that dashboard visibility alone is insufficient for unattended operation. Alert rules are required to turn observable conditions into actionable signals.

## Exercise Timeline

| Time | Event |
|---|---|
| T+00 | Failure-injection workflows submitted |
| T+01 | Worker claims first affected workflow |
| T+01 | Adapter returns transient failure |
| T+01 | Workflow enters retry-scheduled state |
| T+02 onward | Additional retry cycles occur with bounded backoff |
| T+N | Retry budget is exhausted |
| T+N | Workflow moves to dead-letter state |
| T+N | Grafana shows elevated retry count and reduced success ratio |
| T+N | Operator confirms no active queue remains |
| T+N | Post-incident review identifies missing alerting rules |

## Technical Root Cause

The immediate cause was intentional transient failure injection at the integration adapter boundary.

The system interpreted the failure as retryable and applied bounded exponential backoff. After the configured maximum attempt count was reached, the workflow transitioned to dead-letter state.

This behavior is expected and desirable when a dependency is unavailable or unstable and automatic retry must not continue forever.

## Contributing Conditions

### 1. No dependency circuit breaker

The worker continued to claim eligible work while the simulated dependency remained unhealthy. For a longer outage, this could create unnecessary retry pressure.

### 2. Alerting was incomplete

Metrics existed, but no Prometheus alert rules were initially configured. An operator looking at Grafana could see degradation, but the system would not proactively signal it.

### 3. Dead-letter recovery is manual

The reference implementation records terminal failure but does not yet provide a dedicated replay endpoint or operator queue.

## What Worked

- explicit workflow status
- durable audit events
- bounded retry policy
- exponential backoff
- retry exhaustion
- dead-letter transition
- no duplicate creation
- metrics remained available during the failure
- successful work remained intact
- operator could reconstruct what happened from workflow history

## What Did Not Fail

The exercise did not show database loss, duplicate execution, corrupted workflow history, approval bypass, loss of successful results, infinite retry, or a worker crash loop.

## Containment

For a real dependency outage, the preferred containment sequence would be:

1. verify dependency health
2. identify affected workflow type or adapter
3. determine whether retries are amplifying load
4. reduce or pause new intake for the affected path
5. preserve healthy unrelated work
6. increase backoff only if appropriate
7. avoid broad restarts unless state integrity requires them

## Recovery

Recovery should not be declared solely because errors stop. Verification should include:

- dependency health restored
- new workflow succeeds
- queue depth returns to expected range
- oldest queued age returns to baseline
- retry pressure falls
- dead-letter work is reviewed
- no duplicate side effects occurred
- audit state remains internally consistent

## Corrective Actions

| Action | Status | Purpose |
|---|---|---|
| Add queue backlog alert | Complete | Detect sustained queue growth |
| Add queued-age alert | Complete | Detect stalled work even when queue depth is small |
| Add dead-letter alert | Complete | Surface exhausted retries |
| Add retry-pressure alert | Complete | Detect unstable dependencies early |
| Add success-ratio alert | Complete | Detect broad workflow degradation |
| Add controlled incident drill | Complete | Make failure testing repeatable |
| Add dead-letter replay tooling | Planned | Improve operator recovery |
| Add circuit-breaker behavior | Planned | Reduce pressure during dependency outages |
| Add dependency-specific metrics | Planned | Improve isolation and diagnosis |

## Design Lessons

### Retry is not recovery

Retries buy time for transient conditions. They do not fix a dependency outage.

### Queue depth alone is insufficient

A single old item may matter more than a short burst of many recent items. Queue age must be measured alongside queue size.

### Dead-letter is a controlled outcome

A dead-letter record is preferable to infinite retry or silent loss.

### Observability needs action thresholds

Metrics explain the system. Alerts tell an operator when attention is required.

### Recovery needs proof

A service returning HTTP 200 is not sufficient evidence that business processing has recovered.

## Interview Summary

I injected transient integration failures into the workflow platform to validate retry, backoff, dead-letter handling, and observability. The system preserved state and avoided duplicate work, but the exercise exposed that metrics alone were not enough, so I added Prometheus alert rules for retry pressure, queue age, dead letters, and success ratio. The goal was controlled failure behavior and a disciplined improvement loop.
