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
  /**
   * Highest durable message id the browser had seen when this prompt was
   * sent. Durable turns that start above it were appended by this prompt, so
   * they can be attached to this epoch (see `linkDurableTurns`).
   */
  messagesWatermark?: number | null;
}

export type ServerMessage = MessageEntry;
