/** Wire types for the fleet-base Worker API. */

export interface ModelRef {
  provider: string;
  id: string;
}

export interface CatalogModel extends ModelRef {
  name: string;
  contextWindow: number;
  maxTokens: number;
}

export interface RouterInfo {
  baseUrl: string;
  /** `null` means the router was unreachable during this request. */
  live: string[] | null;
}

export interface ModelsResponse {
  default: ModelRef | null;
  configured: Record<string, boolean>;
  catalog: CatalogModel[];
  router: RouterInfo;
}

export type PromptStatus = "done" | "unanswered" | (string & {});

export interface PromptResponse {
  text: string;
  submissionId?: string;
  operationId?: string;
  status: PromptStatus;
  reason: string | null;
}

export interface MessageEntry {
  id: string | number | null;
  kind: string | null;
  preview: string;
}

export interface MessagesResponse {
  name: string;
  messages: MessageEntry[];
}

export interface ResetResponse {
  name: string;
  reset: boolean;
}

export interface AgentStateResponse {
  name: string;
  resident: boolean;
}

export interface PromptRequestBody {
  prompt: string;
  requestId: string;
  model?: string;
}

export interface AgentRecord {
  name: string;
  addedAt: number;
  /** Last model explicitly selected for this agent in the UI. */
  modelOverride: string | null;
}
