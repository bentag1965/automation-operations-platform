import { createHash } from "node:crypto";

export interface InboundWebhook {
  source: string;
  eventId?: string;
  eventType: string;
  objectId?: string;
  payload: unknown;
}

export interface AcceptedWebhook {
  idempotencyKey: string;
  normalizedPayload: unknown;
}

export function normalizeWebhook(input: InboundWebhook): AcceptedWebhook {
  if (!input.source || !input.eventType) {
    throw new Error("source and eventType are required");
  }

  const stableIdentity =
    input.eventId ??
    [input.source, input.objectId ?? "unknown", input.eventType].join(":");

  const idempotencyKey = createHash("sha256")
    .update(stableIdentity)
    .digest("hex");

  return {
    idempotencyKey,
    normalizedPayload: input.payload,
  };
}
