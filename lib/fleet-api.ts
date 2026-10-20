import { agentPath } from "./agent-name";
import type {
  AgentStateResponse,
  MessagesResponse,
  ModelsResponse,
  PaperclipAgent,
  PaperclipAgentsResponse,
  PromptRequestBody,
  PromptResponse,
  ResetResponse,
  ServerAgent,
  ServerAgentsResponse,
} from "./fleet-types";

export class FleetApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "FleetApiError";
    this.status = status;
    this.details = details;
  }
}

interface FetchOptions {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
  /** Skip the automatic redirect to /unlock on 401 (used by the unlock page). */
  skipAuthRedirect?: boolean;
}

async function request<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers = new Headers({ accept: "application/json" });
  if (options.body !== undefined) headers.set("content-type", "application/json");

  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new FleetApiError(
      "Could not reach the Fleet UI server. Check that it is running and FLEET_URL points at your Worker.",
      0,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  let payload: unknown = null;
  if (contentType.includes("application/json")) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    payload = await response.text().catch(() => "");
  }

  if (response.status === 401 && !options.skipAuthRedirect) {
    handleUnauthorized();
  }

  if (!response.ok) {
    const message = extractError(payload) ?? `Request failed (HTTP ${response.status}).`;
    throw new FleetApiError(message, response.status, payload);
  }

  return payload as T;
}

function extractError(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return payload.trim() || null;
  if (typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
    if (typeof record.message === "string") return record.message;
  }
  return null;
}

function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("fleet:unauthorized"));
  if (window.location.pathname !== "/unlock") {
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/unlock?next=${encodeURIComponent(next)}`);
  }
}

export async function getHealth(signal?: AbortSignal): Promise<string> {
  const response = await fetch("/api/health", {
    signal,
    cache: "no-store",
    headers: { accept: "text/plain" },
    credentials: "same-origin",
  });
  if (response.status === 401) {
    handleUnauthorized();
    throw new FleetApiError("Locked.", 401);
  }
  if (!response.ok) {
    throw new FleetApiError(`Health check failed (HTTP ${response.status}).`, response.status);
  }
  return response.text();
}

export function getModels(signal?: AbortSignal): Promise<ModelsResponse> {
  return request<ModelsResponse>("/api/models", { signal });
}

function normalizeServerAgents(payload: unknown): ServerAgent[] {
  const record =
    payload !== null && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as { agents?: unknown })
      : null;
  const raw = Array.isArray(payload) ? payload : Array.isArray(record?.agents) ? record.agents : [];
  const agents = new Map<string, ServerAgent>();

  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!name || agents.has(name)) continue;
    const lastActive = typeof entry.lastActive === "string" ? entry.lastActive : "";
    const prompts =
      typeof entry.prompts === "number" && Number.isFinite(entry.prompts)
        ? Math.max(0, Math.floor(entry.prompts))
        : 0;
    agents.set(name, { name, lastActive, prompts });
  }

  return [...agents.values()];
}

/** Read the server-side agent index. Throws on transport/HTTP errors. */
export async function getServerAgents(
  limit = 200,
  prefix?: string,
  signal?: AbortSignal,
): Promise<ServerAgent[]> {
  const safeLimit = Math.min(1000, Math.max(1, Math.round(limit)));
  const params = new URLSearchParams({ limit: String(safeLimit) });
  const trimmedPrefix = prefix?.trim();
  if (trimmedPrefix) params.set("prefix", trimmedPrefix);
  const payload = await request<ServerAgentsResponse>(`/api/agents?${params.toString()}`, {
    signal,
  });
  return normalizeServerAgents(payload);
}

/**
 * Rail fallback: never let an unreachable Worker blank or break the UI. The
 * proxy's sanitized 502, a network failure, or a malformed payload all degrade
 * to the browser-local recents.
 */
export async function fetchServerAgents(signal?: AbortSignal): Promise<ServerAgent[]> {
  try {
    return await getServerAgents(200, undefined, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    return [];
  }
}

/** Read the optional Paperclip directory through its server-only route. */
export async function getPaperclipAgents(signal?: AbortSignal): Promise<PaperclipAgentsResponse> {
  const payload = await request<unknown>("/api/paperclip/agents", { signal });
  const raw = Array.isArray(payload) ? payload : [];
  const byName = new Map<string, PaperclipAgent>();

  for (const item of raw) {
    if (item === null || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    if (!name || byName.has(name)) continue;
    const lastActive = typeof entry.lastActive === "string" ? entry.lastActive : undefined;
    byName.set(name, {
      name,
      ...(lastActive ? { lastActive } : {}),
      source: "paperclip",
    });
  }

  const agents = [...byName.values()];
  return { enabled: agents.length > 0, agents, count: agents.length };
}

/**
 * Paperclip is optional: disabled, offline, or misconfigured means "no section"
 * rather than a rail error. Auth redirects still happen inside `request`.
 */
export async function fetchPaperclipAgents(
  signal?: AbortSignal,
): Promise<PaperclipAgentsResponse> {
  try {
    return await getPaperclipAgents(signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    return { enabled: false, agents: [], count: 0 };
  }
}

export function getAgentState(name: string, signal?: AbortSignal): Promise<AgentStateResponse> {
  return request<AgentStateResponse>(agentPath(name, "/state"), { signal });
}

export function getMessages(
  name: string,
  limit = 50,
  signal?: AbortSignal,
): Promise<MessagesResponse> {
  const safeLimit = Math.min(100, Math.max(1, Math.round(limit)));
  return request<MessagesResponse>(`${agentPath(name, "/messages")}?limit=${safeLimit}`, {
    signal,
  });
}

export function resetAgent(name: string): Promise<ResetResponse> {
  return request<ResetResponse>(agentPath(name, "/reset"), { method: "POST" });
}

export interface PromptResult {
  response: PromptResponse;
  latencyMs: number;
}

export async function promptAgent(
  name: string,
  body: PromptRequestBody,
  signal?: AbortSignal,
): Promise<PromptResult> {
  const startedAt = performance.now();
  const response = await request<PromptResponse>(agentPath(name, "/prompt"), {
    method: "POST",
    body,
    signal,
  });
  return { response, latencyMs: Math.max(0, performance.now() - startedAt) };
}
