# Production Workflow Patterns

This repository is a public reference implementation. Its design is informed by hands-on automation work across publishing, content operations, media processing, AI-assisted workflows, synchronization, approvals, and API integrations.

The purpose of this document is to show the transferable engineering patterns without reproducing private production systems.

## Pattern 1: Durable Queue Processing

Typical responsibilities:

- accept or discover eligible work
- assign explicit status
- prevent duplicate claims
- mark work as processing before external side effects
- persist the result of the external action
- distinguish retryable from terminal failure
- preserve enough state for operator recovery

Public implementation:

- PostgreSQL workflow records
- explicit lifecycle status
- worker claims
- retry scheduling
- dead-letter state
- audit events

## Pattern 2: Human Approval Gates

Some workflows should not execute immediately.

Typical reasons include:

- external publishing
- high-impact actions
- irreversible changes
- quality review
- policy or business-rule review

Public implementation:

- `awaiting_approval` state
- separate approval record
- explicit actor and note
- continuation only after approval

## Pattern 3: Fan-Out

One canonical item may produce several downstream actions.

Typical examples:

- one source item to multiple delivery channels
- one approved artifact to several destinations
- one event to several integration adapters

Key principle:

Create downstream work as separate durable records rather than hiding all fan-out inside one opaque execution.

## Pattern 4: Asynchronous External Work

Some integrations return before the real work is complete.

Typical handling:

- submit work
- persist external job identity
- poll or receive completion signal
- reconcile final state
- recover abandoned work
- close the durable claim only when completion is confirmed

## Pattern 5: AI as a Controlled Pipeline Stage

AI generation is treated as one service inside a workflow rather than as the workflow itself.

The surrounding system owns:

- source inputs
- prompt/version metadata
- structured output expectations
- parsing
- validation
- retry policy
- approval
- downstream side effects
- auditability

This makes probabilistic model output usable inside deterministic operations.

## Pattern 6: Operational Evidence

A workflow is not complete merely because an external action was attempted.

Useful operational evidence includes:

- workflow ID
- source identity
- current state
- attempt count
- timestamps
- approval decision
- external result identity
- failure reason
- audit events
- metrics

These patterns are implemented in the runnable reference system and are observable through Prometheus and Grafana.
