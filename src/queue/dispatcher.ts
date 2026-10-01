import { Workflow } from "../domain/workflow";

export interface DispatchDecision {
  action: "execute" | "await_approval" | "skip";
  reason: string;
}

export function decideNextAction(workflow: Workflow): DispatchDecision {
  if (workflow.status === "succeeded" || workflow.status === "cancelled") {
    return { action: "skip", reason: "workflow is already terminal" };
  }

  if (workflow.approvalRequired && workflow.status !== "processing") {
    return {
      action: "await_approval",
      reason: "workflow requires explicit approval",
    };
  }

  if (workflow.attemptCount >= workflow.maxAttempts) {
    return {
      action: "skip",
      reason: "maximum attempts reached",
    };
  }

  return { action: "execute", reason: "workflow is ready for execution" };
}

export function calculateBackoffSeconds(
  attempt: number,
  baseSeconds = 5,
  maximumSeconds = 900
): number {
  return Math.min(baseSeconds * 2 ** Math.max(attempt - 1, 0), maximumSeconds);
}
