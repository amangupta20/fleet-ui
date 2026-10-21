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
  /** File a tool touched. Only present once the Worker returns file data. */
  filePath?: string | null;
  /** Patch for that file. Only present once the Worker returns file data. */
  diff?: { before?: string | null; after?: string | null } | null;
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

/** One entry from fleet-base `GET /agents` (Registry DO, names only). */
export interface ServerAgent {
  name: string;
  lastActive: string;
  prompts: number;
}

export interface ServerAgentsResponse {
  agents: ServerAgent[];
  count: number;
}

/** Where a row in the merged agent rail came from. */
export type AgentSource = "fleet" | "paperclip" | "local";

/** Normalized Paperclip entry returned by `/api/paperclip/agents`. */
export interface PaperclipAgent {
  name: string;
  lastActive?: string;
  source: "paperclip";
}

export interface PaperclipAgentsResponse {
  enabled: boolean;
  agents: PaperclipAgent[];
  count: number;
}

export interface AgentRecord {
  name: string;
  addedAt: number;
  /** Last model explicitly selected for this agent in the UI. */
  modelOverride: string | null;
  /** Optional rail-only label. The canonical name is still used for API calls. */
  label?: string | null;
  /** Starred locally. Purely a rail affordance; it never changes server state. */
  starred?: boolean;
}
