export interface AdapterResult {
  accepted: boolean;
  externalId: string;
  echoedPayload: unknown;
}

export class MockIntegrationAdapter {
  async execute(payload: Record<string, unknown>): Promise<AdapterResult> {
    if (payload.failMode === "transient") {
      throw new Error("transient mock dependency failure");
    }

    if (payload.failMode === "permanent") {
      throw new Error("permanent mock dependency rejection");
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      accepted: true,
      externalId: `mock-${Date.now()}`,
      echoedPayload: payload,
    };
  }
}
