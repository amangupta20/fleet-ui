import { agentPath } from "./agent-name";
import type {
  AgentStateResponse,
  MessagesResponse,
  ModelsResponse,
  PromptRequestBody,
  PromptResponse,
  ResetResponse,
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
