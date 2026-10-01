import test from "node:test";
import assert from "node:assert/strict";
import { normalizeWebhook } from "../src/ingress/webhook-handler";
import { calculateBackoffSeconds, decideNextAction } from "../src/queue/dispatcher";

test("webhook normalization is deterministic for the same event identity", () => {
  const first = normalizeWebhook({
    source: "crm",
    eventId: "evt-123",
    eventType: "record.updated",
    payload: { id: 42 },
  });

  const second = normalizeWebhook({
    source: "crm",
    eventId: "evt-123",
    eventType: "record.updated",
    payload: { id: 999 },
  });

  assert.equal(first.idempotencyKey, second.idempotencyKey);
});

test("approval-required workflows pause before execution", () => {
  const decision = decideNextAction({
    id: "wf-1",
    idempotencyKey: "key-1",
    workflowType: "publish",
    source: "example",
    status: "queued",
    payload: {},
    attemptCount: 0,
    maxAttempts: 5,
    approvalRequired: true,
  });

  assert.equal(decision.action, "await_approval");
});

test("backoff grows exponentially and respects the ceiling", () => {
  assert.equal(calculateBackoffSeconds(1, 5, 900), 5);
  assert.equal(calculateBackoffSeconds(2, 5, 900), 10);
  assert.equal(calculateBackoffSeconds(20, 5, 900), 900);
});
