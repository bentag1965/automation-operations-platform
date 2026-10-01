export interface QueueItem {
  id: string;
  status: "ready" | "processing" | "scheduled" | "error";
  approved: boolean;
  channelId: string;
  text: string;
  dueAt: string;
}

export interface PublishingRequest {
  channelId: string;
  text: string;
  dueAt: string;
}

export type PublishingResult =
  | { ok: true; externalId: string }
  | { ok: false; error: string };

export interface PublishingQueue {
  nextReady(): Promise<QueueItem | null>;
  markProcessing(id: string): Promise<void>;
  markScheduled(id: string, externalId: string, scheduledAt: string): Promise<void>;
  markFailed(id: string, error: string, failedAt: string): Promise<void>;
}

export interface PublishingAdapter {
  schedule(request: PublishingRequest): Promise<PublishingResult>;
}

export async function dispatchNext(
  queue: PublishingQueue,
  adapter: PublishingAdapter,
  now = () => new Date()
): Promise<"empty" | "scheduled" | "failed"> {
  const item = await queue.nextReady();

  if (!item) {
    return "empty";
  }

  if (!item.approved || item.status !== "ready") {
    return "empty";
  }

  await queue.markProcessing(item.id);

  const result = await adapter.schedule({
    channelId: item.channelId,
    text: item.text,
    dueAt: item.dueAt,
  });

  const timestamp = now().toISOString();

  if (result.ok) {
    await queue.markScheduled(item.id, result.externalId, timestamp);
    return "scheduled";
  }

  await queue.markFailed(item.id, result.error, timestamp);
  return "failed";
}
