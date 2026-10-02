# Interview Guide

## Short Explanation

I have worked with both visual orchestration and code-based automation. The tooling changes, but the architecture questions do not: where truth lives, how work is claimed, how duplicate execution is prevented, how failures recover, when humans approve actions, and what evidence remains afterward.

This repository is the code-based reference implementation of those same operational principles.

## Key Points to Explain

### Architecture before tooling

I start with workflow state, ownership, failure behavior, and recovery. Whether the implementation uses a visual automation platform, TypeScript, PowerShell, or another tool comes after those decisions.

### Low-code can still require distributed-systems thinking

Visual workflows still need:

- idempotency
- state management
- retries
- error classification
- concurrency control
- observability
- auditability

The canvas is not the architecture.

### AI belongs inside controls

I treat model calls as probabilistic dependencies. The system around them provides deterministic controls such as validation, structured output, source boundaries, approval, and audit history.

### I remain hands-on

The public stack is runnable locally and includes:

- API ingress
- PostgreSQL state
- background worker
- approval flow
- retry/dead-letter handling
- automated tests
- CI
- Prometheus
- Grafana

## Useful Interview Example

A good example is a workflow that receives duplicate events while an external service is intermittently failing.

The design should answer:

1. How is the duplicate recognized?
2. Which record owns the work?
3. How does only one worker claim it?
4. Which failures retry?
5. How long does backoff grow?
6. What happens after retry exhaustion?
7. What can an operator inspect afterward?

The reference platform answers all seven explicitly.
