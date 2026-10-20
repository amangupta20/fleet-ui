import type { ChatRun } from "./chat-types";

/**
 * Agent lifecycle.
 *
 * fleet-base exposes exactly one coarse fact per agent today
 * (`GET /agent/:name/state` → `{ resident: true }`), so the console derives the
 * five-state lifecycle from what it can actually prove:
 *
 *   resident              → idle
 *   prompt in flight      → running
 *   model_error / failure → error
 *   probe still pending   → initializing
 *   probe unreachable     → closed
 *
 * The mapping lives alone in this file on purpose. When the Worker starts
 * reporting real lifecycle states, `deriveAgentLifecycle` is the only function
 * that changes — no component reads the coarse state directly.
 */
export type AgentLifecycle = "initializing" | "idle" | "running" | "error" | "closed";

/**
 * The reachability probe, shaped like the query results
 * `hooks/use-fleet.ts` returns. Duck-typed on purpose: the rail and the pane
 * pass different query objects.
 */
interface ProbeQuery {
  isPending: boolean;
  isError: boolean;
  data?: { resident?: boolean } | undefined;
}

interface LifecycleInput {
  /** Reachability probe for `GET /agent/:name/state`. */
  probe: ProbeQuery;
  /** A `POST /agent/:name/prompt` is in flight in this browser. */
  promptInFlight?: boolean;
  /** The newest run recorded for this agent. */
  lastRun?: ChatRun | null;
}

export function deriveAgentLifecycle(input: LifecycleInput): AgentLifecycle {
  if (input.promptInFlight) return "running";
  if (runFailed(input.lastRun ?? null)) return "error";
  if (input.probe.isPending) return "initializing";
  if (input.probe.isError || input.probe.data?.resident === false) return "closed";
  return "idle";
}

/**
 * A run counts as failed when the transport failed or the Worker answered with
 * a `model_error` reason — the terse reason fleet-base uses for generation
 * failures (see fleet-base `recentMessages`).
 */
function runFailed(run: ChatRun | null | undefined): boolean {
  if (!run) return false;
  if (run.status === "error") return true;
  return (run.reason ?? "").toLowerCase().includes("model_error");
}
