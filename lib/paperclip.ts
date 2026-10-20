import type { PaperclipAgent } from "./fleet-types";

/**
 * Server-only helpers for the optional Paperclip directory.
 *
 * Nothing in this module is imported by a client component. `PAPERCLIP_URL`
 * and `PAPERCLIP_API_KEY` remain server env values and are never returned to
 * the browser, logged with their values, or forwarded to the fleet Worker.
 */

export interface PaperclipConfig {
  /** Base URL as configured, without a trailing slash. */
  baseUrl: string;
  apiKey: string;
  /** Fully resolved agents endpoint. */
  agentsUrl: string;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

/**
 * Resolve the Directory endpoint from a base that may already include `/api`
 * (or even the full `/agents` path). This keeps the env contract small while
 * tolerating the common ways operators paste a Paperclip URL.
 */
export function paperclipAgentsUrl(rawBaseUrl: string): string {
  const base = new URL(rawBaseUrl);
  base.search = "";
  base.hash = "";
  const path = base.pathname.replace(/\/+$/, "");
  if (/\/agents$/.test(path)) {
    base.pathname = path;
  } else if (/\/api$/.test(path) || path.includes("/api/")) {
    base.pathname = `${path}/agents`;
  } else {
    base.pathname = `${path}/api/agents`;
  }
  return base.toString();
}

/**
 * Paperclip is enabled only when both values are present. A partially
 * configured server stays disabled and hidden rather than exposing an error.
 */
export function resolvePaperclipConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): PaperclipConfig | null {
  const rawUrl = env.PAPERCLIP_URL?.trim();
  const apiKey = env.PAPERCLIP_API_KEY?.trim();
  if (!rawUrl || !apiKey) return null;

  let baseUrl: string;
  let agentsUrl: string;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    baseUrl = rawUrl.replace(/\/+$/, "");
    agentsUrl = paperclipAgentsUrl(rawUrl);
  } catch {
    return null;
  }

  return { baseUrl, apiKey, agentsUrl };
}

/**
 * Normalize the control plane's agent list into the tiny shape the rail needs.
 * Accepts a bare array or `{agents|data|items|results: [...]}`, and objects
 * that expose a display name, URL key, or id.
 */
export function normalizePaperclipAgents(payload: unknown): PaperclipAgent[] {
  const record = asRecord(payload);
  const candidates = Array.isArray(payload)
    ? payload
    : record
      ? [record.agents, record.data, record.items, record.results].find(Array.isArray) ?? []
      : [];

  const agents = new Map<string, PaperclipAgent>();
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const name = candidate.trim();
      if (name && !agents.has(name)) {
        agents.set(name, { name, source: "paperclip" });
      }
      continue;
    }

    const entry = asRecord(candidate);
    if (!entry) continue;
    const name = firstString(
      entry.name,
      entry.displayName,
      entry.urlKey,
      entry.agentUrlKey,
      entry.shortName,
      entry.id,
      entry.agentId,
    );
    if (!name || agents.has(name)) continue;
    const lastActive = firstString(
      entry.lastActive,
      entry.lastActiveAt,
      entry.lastHeartbeatAt,
      entry.updatedAt,
    );
    agents.set(name, {
      name,
      ...(lastActive ? { lastActive } : {}),
      source: "paperclip",
    });
  }

  return [...agents.values()];
}
