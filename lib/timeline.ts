import type { ChatRun } from "./chat-types";
import type { MessageEntry } from "./fleet-types";

/**
 * Timeline model.
 *
 * Every turn the console shows is a timeline row. Rows come from two proven
 * sources:
 *
 *   - the browser run log (`POST /agent/:name/prompt` responses), which carry
 *     the real `submissionId` the Worker returned, and
 *   - the durable transcript (`GET /agent/:name/messages`), which carries the
 *     tool activity but no `submissionId`.
 *
 * Epochs group rows by `submissionId`: one prompt = one epoch. A durable turn
 * is attached to an epoch when the browser can point at it — see
 * `linkDurableTurns` — and otherwise stays in its own labelled group instead
 * of being attached to a turn it might not belong to.
 */

type TimelineRowType =
  | "user"
  | "model"
  | "tool-call"
  | "tool-result"
  | "permission"
  | "system";

type ToolCategory = "shell" | "read" | "edit" | "write" | "search" | "other";

/** Outcome a row or epoch reports. */
type TimelineStatus = "done" | "error" | "unanswered" | "running";

/** A real patch, only present when the backend ships file data. */
export interface TimelineDiff {
  before: string;
  after: string;
}

/** A prompt that is still in flight. Never persisted: it is live state. */
export interface InflightPrompt {
  prompt: string;
  model: string | null;
  startedAt: number;
}

export interface TimelineRow {
  id: string;
  type: TimelineRowType;
  /** Row heading: tool name, `Fleet`, `system`, `permission`. */
  title: string;
  /** Body text (prompt, answer, preview). */
  text: string;
  /** Secondary line: origin, note, or empty-state explanation. */
  detail?: string | null;
  /** Worker message id, for durable rows. */
  messageId?: string | number | null;
  /** Tool category, for the row tag. */
  category?: ToolCategory | null;
  /** File path — backend-provided only, `null` until then. */
  filePath?: string | null;
  /** Real patch — backend-provided only, `null` until then. */
  diff?: TimelineDiff | null;
  status?: TimelineStatus | null;
}

export interface TimelineEpoch {
  /** Stable key for the epoch (submissionId when known). */
  id: string;
  /** Epoch key: the Worker `submissionId`, `null` when it is not exposed. */
  submissionId: string | null;
  /** Prompt text that opened the epoch. */
  prompt: string;
  /** Model that answered, when the browser knows it. */
  model: string | null;
  createdAt: number | null;
  status: TimelineStatus;
  /** Highest durable message id seen when the prompt was sent. */
  watermark: number | null;
  rows: TimelineRow[];
  /** Durable rows that belong to this epoch. */
  durableRows: TimelineRow[];
}

/** Tool markers the Worker writes into a preview: `tool:<name>`. */
const TOOL_MARKER = /tool:([A-Za-z0-9_.-]+)/g;
/** A marker that sits on a line of its own. */
const TOOL_MARKER_LINE = /^\s*tool:[A-Za-z0-9_.-]+\s*$/;

/**
 * The key an epoch is filed under: the Worker's `submissionId`, falling back
 * to the operation id and then to the local run id.
 */
export function epochKey(run: ChatRun): string {
  return run.submissionId ?? run.operationId ?? run.id;
}

/** Map a Worker message kind onto a timeline row type. */
export function rowTypeForKind(kind: string | null | undefined): TimelineRowType {
  const value = (kind ?? "").toLowerCase();
  if (value.includes("permission") || value.includes("approval")) return "permission";
  if (value.includes("tool-result") || value.includes("tool_result")) return "tool-result";
  if (value.includes("tool-call") || value.includes("tool_call")) return "tool-call";
  if (value.includes("tool")) return "tool-result";
  if (value.includes("assistant")) return "model";
  if (value.includes("user")) return "user";
  return "system";
}

/** Classify a tool name into the categories the console tags. */
function toolCategory(tool: string | null | undefined): ToolCategory {
  const name = (tool ?? "").trim().toLowerCase();
  if (!name) return "other";
  if (["shell", "bash", "sh", "zsh", "exec", "command", "run", "terminal"].includes(name)) return "shell";
  if (["read", "cat", "view", "open", "ls", "list"].includes(name)) return "read";
  if (["edit", "patch", "apply", "apply_patch", "replace", "str_replace"].includes(name)) return "edit";
  if (["write", "create", "save", "mkdir"].includes(name)) return "write";
  if (["search", "grep", "glob", "find", "rg", "ripgrep"].includes(name)) return "search";
  return "other";
}

/** Tools that can change a file, and therefore get a diff region. */
export function touchesFiles(category: ToolCategory): boolean {
  return category === "edit" || category === "write";
}

/** Tool names found in a Worker preview. */
function extractToolNames(preview: string): string[] {
  const names: string[] = [];
  for (const match of preview.matchAll(TOOL_MARKER)) {
    const name = match[1];
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

/**
 * Split a preview into the text a model wrote and the tool names it called.
 *
 * The Worker writes `tool:<name>` markers into the preview. A marker that
 * sits on its own line is moved into its own tool row instead of being
 * repeated inside the model turn — nothing is dropped, the marker line is
 * represented by the tool row that names it.
 */
function splitToolMarkers(preview: string): { text: string; tools: string[] } {
  const tools = extractToolNames(preview);
  const kept = preview
    .split("\n")
    .filter((line) => !TOOL_MARKER_LINE.test(line))
    .join("\n")
    .trim();
  return { text: kept, tools };
}

/**
 * Read the diff the backend sent with a message, if any.
 *
 * fleet-base sends `{id, kind, preview}` today, so this is always empty. The
 * adapter exists so the diff region is wired to real data the moment the
 * Worker starts returning a file path and a patch — no second code path.
 */
function diffFromMessage(message: MessageEntry): { filePath: string | null; diff: TimelineDiff | null } {
  const payload = message.diff ?? null;
  if (!payload) {
    return { filePath: message.filePath ?? null, diff: null };
  }
  return {
    filePath: message.filePath ?? null,
    diff: { before: payload.before ?? "", after: payload.after ?? "" },
  };
}

/** A user-turn row: the prompt that opened the epoch. */
function userRow(id: string, prompt: string, status: TimelineStatus): TimelineRow {
  return {
    id,
    type: "user",
    title: "you",
    text: prompt,
    detail: null,
    status,
  };
}

/** One durable message → one timeline row (plus any tool-call rows it names). */
function rowsFromMessages(messages: readonly MessageEntry[]): TimelineRow[] {
  const rows: TimelineRow[] = [];
  messages.forEach((message, index) => {
    const kind = message.kind ?? null;
    const type = rowTypeForKind(kind);
    const preview = message.preview ?? "";
    const messageId = message.id ?? null;
    const id = `msg-${messageId ?? index}-${index}`;
    const { filePath, diff } = diffFromMessage(message);

    if (type === "model") {
      const { text, tools } = splitToolMarkers(preview);
      rows.push({
        id,
        type: "model",
        title: "Fleet",
        text,
        detail: tools.length > 0 ? "worker preview · tool calls below" : null,
        messageId,
        status: "done",
      });
      for (const tool of tools) {
        const category = toolCategory(tool);
        rows.push({
          id: `${id}-tool-${tool}`,
          type: "tool-call",
          title: tool,
          text: "",
          detail: "tool call named in the worker preview",
          messageId,
          category,
          filePath,
          diff,
          status: "done",
        });
      }
      return;
    }

    if (type === "user") {
      rows.push({
        id,
        type: "user",
        title: "you",
        text: preview === "(no text content)" ? "" : preview,
        detail: preview === "(no text content)" ? "prompt text is not returned by the Worker" : null,
        messageId,
        status: "done",
      });
      return;
    }

    if (type === "tool-call" || type === "tool-result") {
      const tools = extractToolNames(preview);
      const tool = tools[0] ?? null;
      const category = toolCategory(tool);
      rows.push({
        id,
        type,
        title: tool ?? (type === "tool-result" ? "tool result" : "tool call"),
        text: preview,
        detail: tool ? null : "tool name is not returned by the Worker",
        messageId,
        category,
        filePath,
        diff,
        status: "done",
      });
      return;
    }

    rows.push({
      id,
      type,
      title: kind ?? "system",
      text: preview,
      detail: null,
      messageId,
      status: "done",
    });
  });
  return rows;
}

/**
 * Split durable rows into turns. A `user` row opens a turn; everything after
 * it belongs to that turn. The Worker does not return a `submissionId` per
 * message, so these epochs carry `submissionId: null`.
 */
function epochsFromMessages(messages: readonly MessageEntry[]): TimelineEpoch[] {
  const rows = rowsFromMessages(messages);
  const epochs: TimelineEpoch[] = [];
  let current: TimelineEpoch | null = null;

  for (const row of rows) {
    if (row.type === "user" || !current) {
      current = {
        id: `durable-${epochs.length}-${row.messageId ?? row.id}`,
        submissionId: null,
        prompt: row.text,
        model: null,
        createdAt: null,
        status: "done",
        watermark: null,
        rows: [row],
        durableRows: [],
      };
      epochs.push(current);
      continue;
    }
    current.rows.push(row);
  }
  return epochs;
}

/**
 * One browser run = one epoch, keyed by the Worker's `submissionId`.
 *
 * Re-sending a request id is idempotent on the Worker: the same
 * `submissionId` comes back, so it is the same durable run and therefore the
 * same epoch. The newest record for that id wins.
 */
function epochsFromRuns(runs: readonly ChatRun[]): TimelineEpoch[] {
  const latest = new Map<string, ChatRun>();
  for (const run of runs) {
    latest.set(epochKey(run), run);
  }
  return [...latest.values()].map((run) => {
    const submissionId = run.submissionId ?? run.operationId ?? null;
    const status = run.status === "done" ? "done" : run.status === "unanswered" ? "unanswered" : "error";
    const rows: TimelineRow[] = [
      userRow(`${run.id}-user`, run.prompt, "done"),
      {
        id: `${run.id}-model`,
        type: "model",
        title: "Fleet",
        text: run.error ?? run.text,
        detail: run.error ? `HTTP ${run.httpStatus ?? "—"}` : run.reason,
        status,
      },
    ];
    return {
      id: epochKey(run),
      submissionId,
      prompt: run.prompt,
      model: run.model,
      createdAt: run.createdAt,
      status,
      watermark: run.messagesWatermark ?? null,
      rows,
      durableRows: [],
    };
  });
}

/**
 * Attach durable turns to the epochs that caused them.
 *
 * The Worker does not return a `submissionId` per message, so the browser
 * reads the transcript right before it sends a prompt and records the highest
 * message id it saw (the watermark). A durable turn that starts above that
 * watermark was appended by that prompt, so it belongs to that epoch. Turns
 * that no epoch can point at stay in the durable group — the console never
 * attaches rows it cannot point at.
 */
function linkDurableTurns(
  epochs: readonly TimelineEpoch[],
  durableEpochs: readonly TimelineEpoch[],
): { epochs: TimelineEpoch[]; durableEpochs: TimelineEpoch[] } {
  const claimed = new Set<string>();
  const linked = new Map<string, TimelineRow[]>();

  // Newest epoch first: it has the highest watermark, so it takes the turns
  // above it; the epoch before it then takes what is left above its own.
  [...epochs]
    .reverse()
    .forEach((epoch) => {
      const watermark = epoch.watermark;
      if (watermark === null) {
        linked.set(epoch.id, []);
        return;
      }
      const mine = durableEpochs.filter(
        (turn) => !claimed.has(turn.id) && firstMessageId(turn) > watermark,
      );
      for (const turn of mine) claimed.add(turn.id);
      linked.set(epoch.id, mine.flatMap((turn) => turn.rows));
    });

  return {
    epochs: epochs.map((epoch) => ({ ...epoch, durableRows: linked.get(epoch.id) ?? [] })),
    durableEpochs: durableEpochs.filter((turn) => !claimed.has(turn.id)),
  };
}

/** The lowest message id inside a durable turn. */
function firstMessageId(epoch: TimelineEpoch): number {
  const ids = epoch.rows
    .map((row) => toMessageId(row.messageId))
    .filter((id): id is number => id !== null);
  return ids.length > 0 ? Math.min(...ids) : 0;
}

/** A Worker message id as a number, or `null` when it has none. */
function toMessageId(id: string | number | null | undefined): number | null {
  if (typeof id === "number") return Number.isFinite(id) ? id : null;
  if (typeof id === "string" && id.trim() !== "") {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * The highest durable message id the browser has seen. An empty transcript is
 * a read with nothing in it, so the watermark is 0 and the turn the prompt
 * appends can still be attached to its epoch.
 */
export function maxMessageId(messages: readonly MessageEntry[]): number {
  const ids = messages
    .map((message) => toMessageId(message.id))
    .filter((id): id is number => id !== null);
  return ids.length > 0 ? Math.max(...ids) : 0;
}

interface TimelineInput {
  /** Browser run log for this agent. */
  runs: readonly ChatRun[];
  /** Durable transcript for this agent. */
  messages: readonly MessageEntry[];
  /** A prompt that is still in flight (no submissionId yet). */
  inflight?: InflightPrompt | null;
}

export interface Timeline {
  /** Epochs keyed by submissionId (browser runs). */
  epochs: TimelineEpoch[];
  /** Durable turns that no epoch can point at. */
  durableEpochs: TimelineEpoch[];
}

/** Build the timeline for one agent. */
export function buildTimeline(input: TimelineInput): Timeline {
  const epochs = epochsFromRuns(input.runs);
  if (input.inflight) {
    epochs.push({
      id: "inflight",
      submissionId: null,
      prompt: input.inflight.prompt,
      model: input.inflight.model,
      createdAt: input.inflight.startedAt,
      status: "running",
      watermark: null,
      rows: [userRow("inflight-user", input.inflight.prompt, "running")],
      durableRows: [],
    });
  }
  return linkDurableTurns(epochs, epochsFromMessages(input.messages));
}
