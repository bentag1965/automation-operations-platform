export type WorkflowStatus =
  | "received"
  | "validated"
  | "queued"
  | "processing"
  | "awaiting_approval"
  | "retry_scheduled"
  | "succeeded"
  | "failed"
  | "dead_letter"
  | "cancelled";

export interface Workflow<TPayload = unknown, TResult = unknown> {
  id: string;
  idempotencyKey: string;
  workflowType: string;
  source: string;
  status: WorkflowStatus;
  payload: TPayload;
  result?: TResult;
  attemptCount: number;
  maxAttempts: number;
  approvalRequired: boolean;
  nextAttemptAt?: string;
  lastError?: {
    code?: string;
    message: string;
  };
}

export interface WorkflowEvent {
  workflowId: string;
  type: string;
  fromStatus?: WorkflowStatus;
  toStatus?: WorkflowStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
