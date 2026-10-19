import type { MessageEntry, PromptStatus } from "./fleet-types";

export interface ChatRun {
  /** Local, stable list key (not the fleet operation id). */
  id: string;
  prompt: string;
  requestId: string;
  model: string | null;
  text: string;
  status: PromptStatus | "error";
  reason: string | null;
  submissionId: string | null;
  operationId: string | null;
  latencyMs: number | null;
  createdAt: number;
  error: string | null;
  httpStatus: number | null;
}

export type ServerMessage = MessageEntry;
