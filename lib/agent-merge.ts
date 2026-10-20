import { compareAgentNames } from "./agent-name";
import type {
  AgentRecord,
  AgentSource,
  PaperclipAgent,
  ServerAgent,
} from "./fleet-types";

/**
 * One row in the merged agent rail.
 *
 * `source` is the winning origin for this name:
 *   fleet > paperclip > local
 *
 * A name can still carry a `local` record when it is also known to the server;
 * that record holds browser-only metadata (model override, label, star) but
 * never changes the origin of the row or the request path.
 */
export interface MergedAgent {
  name: string;
  source: AgentSource;
  lastActive?: string;
  prompts?: number;
  addedAt?: number;
  local: AgentRecord | null;
}

export interface MergeAgentInput {
  server?: readonly ServerAgent[];
  paperclip?: readonly Pick<PaperclipAgent, "name" | "lastActive">[];
  local?: readonly AgentRecord[];
}

const SOURCE_ORDER: Record<AgentSource, number> = {
  fleet: 0,
  paperclip: 1,
  local: 2,
};

function timeValue(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function byRecencyThenName(a: MergedAgent, b: MergedAgent): number {
  const delta = timeValue(b.lastActive) - timeValue(a.lastActive);
  if (delta !== 0) return delta;
  return compareAgentNames(a.name, b.name);
}

function byAddedThenName(a: MergedAgent, b: MergedAgent): number {
  const delta = (b.addedAt ?? 0) - (a.addedAt ?? 0);
  if (delta !== 0) return delta;
  return compareAgentNames(a.name, b.name);
}

/**
 * Union directory rows by exact name. A duplicate across sources collapses to
 * one row with the strongest origin (fleet, then paperclip, then local).
 *
 * Ordering is deterministic: fleet rows by `lastActive` descending, then
 * paperclip rows by `lastActive` descending, then local-only rows by local
 * `addedAt` descending. Names break ties. This is intentionally *not* a single
 * cross-source timestamp sort: the rail groups sources in that order.
 */
export function mergeAgentRows(input: MergeAgentInput): MergedAgent[] {
  const localByName = new Map<string, AgentRecord>();
  for (const record of input.local ?? []) {
    if (record.name && !localByName.has(record.name)) localByName.set(record.name, record);
  }

  const rows = new Map<string, MergedAgent>();

  for (const agent of input.server ?? []) {
    if (!agent.name || rows.has(agent.name)) continue;
    rows.set(agent.name, {
      name: agent.name,
      source: "fleet",
      lastActive: agent.lastActive,
      prompts: agent.prompts,
      local: localByName.get(agent.name) ?? null,
    });
  }

  for (const agent of input.paperclip ?? []) {
    if (!agent.name || rows.has(agent.name)) continue;
    rows.set(agent.name, {
      name: agent.name,
      source: "paperclip",
      ...(agent.lastActive ? { lastActive: agent.lastActive } : {}),
      local: localByName.get(agent.name) ?? null,
    });
  }

  for (const record of input.local ?? []) {
    if (!record.name || rows.has(record.name)) continue;
    rows.set(record.name, {
      name: record.name,
      source: "local",
      addedAt: record.addedAt,
      local: record,
    });
  }

  return [...rows.values()].sort((a, b) => {
    if (a.source !== b.source) return SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source];
    if (a.source === "local") return byAddedThenName(a, b);
    return byRecencyThenName(a, b);
  });
}

/** Alias used by a few call sites/tests; same selector. */
export const mergeAgents = mergeAgentRows;
