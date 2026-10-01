export interface OperationCommand {
  operation: string;
  data: Record<string, unknown>;
}

export interface OperationResult {
  externalId?: string;
  status: "accepted" | "completed";
  data?: Record<string, unknown>;
}

export interface IntegrationAdapter {
  readonly name: string;
  execute(command: OperationCommand): Promise<OperationResult>;
}

export class MockAdapter implements IntegrationAdapter {
  readonly name = "mock";

  async execute(command: OperationCommand): Promise<OperationResult> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      externalId: "example-" + Date.now(),
      status: "completed",
      data: {
        operation: command.operation,
        referenceImplementation: true,
      },
    };
  }
}
