import test from "node:test";
import assert from "node:assert/strict";
import { dispatchNext, type QueueItem } from "../src/examples/social-dispatcher";

function queueWith(item: QueueItem | null) {
  const events: string[] = [];

  return {
    events,
    queue: {
      async nextReady() {
        return item;
      },
      async markProcessing(id: string) {
        events.push("processing:" + id);
      },
      async markScheduled(id: string, externalId: string) {
        events.push("scheduled:" + id + ":" + externalId);
      },
      async markFailed(id: string, error: string) {
        events.push("failed:" + id + ":" + error);
      },
    },
  };
}

const readyItem: QueueItem = {
  id: "row-42",
  status: "ready",
  approved: true,
  channelId: "channel-demo",
  text: "Example scheduled post",
  dueAt: "2026-10-01T15:00:00Z",
};

test("successful dispatch claims and records external ID", async () => {
  const { queue, events } = queueWith(readyItem);

  const result = await dispatchNext(queue, {
    async schedule() {
      return { ok: true, externalId: "post-123" };
    },
  });

  assert.equal(result, "scheduled");
  assert.deepEqual(events, [
    "processing:row-42",
    "scheduled:row-42:post-123",
  ]);
});

test("failed dispatch records failure state", async () => {
  const { queue, events } = queueWith(readyItem);

  const result = await dispatchNext(queue, {
    async schedule() {
      return { ok: false, error: "provider rejected request" };
    },
  });

  assert.equal(result, "failed");
  assert.deepEqual(events, [
    "processing:row-42",
    "failed:row-42:provider rejected request",
  ]);
});

test("empty queue produces no side effects", async () => {
  const { queue, events } = queueWith(null);

  const result = await dispatchNext(queue, {
    async schedule() {
      throw new Error("should not be called");
    },
  });

  assert.equal(result, "empty");
  assert.deepEqual(events, []);
});
