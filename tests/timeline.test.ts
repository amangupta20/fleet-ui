import { describe, expect, it } from "vitest";

import type { ChatRun } from "@/lib/chat-types";
import type { MessageEntry } from "@/lib/fleet-types";
import {
  buildTimeline,
  epochKey,
  maxMessageId,
  rowTypeForKind,
  touchesFiles,
} from "@/lib/timeline";

const MESSAGES: MessageEntry[] = [
  { id: 7, kind: "pi.user", preview: "(no text content)" },
  { id: 10, kind: "pi.system", preview: "(no text content)" },
  { id: 11, kind: "pi.assistant", preview: "hello probe" },
  { id: 12, kind: "pi.user", preview: "(no text content)" },
  { id: 15, kind: "pi.assistant", preview: "I'll echo that.\ntool:echo\ntool row probe" },
  { id: 17, kind: "pi.tool-result", preview: "tool row probe" },
];

function run(overrides: Partial<ChatRun> = {}): ChatRun {
  return {
    id: "run_1",
    prompt: "Reply with exactly: fleet-ui timeline probe.",
    requestId: "probe_epoch_1",
    model: null,
    text: "fleet-ui timeline probe",
    status: "done",
    reason: null,
    submissionId: "probe_epoch_1",
    operationId: "probe_epoch_1",
    latencyMs: 2411,
    createdAt: 1_760_000_000_000,
    error: null,
    httpStatus: 200,
    ...overrides,
  };
}

describe("rowTypeForKind", () => {
  it("maps the Worker kinds the console sees", () => {
    expect(rowTypeForKind("pi.user")).toBe("user");
    expect(rowTypeForKind("pi.assistant")).toBe("model");
    expect(rowTypeForKind("pi.tool-result")).toBe("tool-result");
    expect(rowTypeForKind("pi.tool-call")).toBe("tool-call");
    expect(rowTypeForKind("pi.system")).toBe("system");
    expect(rowTypeForKind("pi.permission.request")).toBe("permission");
    expect(rowTypeForKind(null)).toBe("system");
  });
});

describe("touchesFiles", () => {
  it("knows which tools can change a file", () => {
    expect(touchesFiles("edit")).toBe(true);
    expect(touchesFiles("write")).toBe(true);
    expect(touchesFiles("read")).toBe(false);
    expect(touchesFiles("shell")).toBe(false);
  });
});

describe("epochKey", () => {
  it("keys a run by its submission id", () => {
    expect(epochKey(run())).toBe("probe_epoch_1");
    expect(epochKey(run({ submissionId: null, operationId: null }))).toBe("run_1");
  });
});

describe("maxMessageId", () => {
  it("returns the highest durable message id", () => {
    expect(maxMessageId(MESSAGES)).toBe(17);
  });

  it("treats an empty transcript as a watermark of 0", () => {
    expect(maxMessageId([])).toBe(0);
  });
});

describe("buildTimeline", () => {
  it("keys one epoch per run by the Worker submissionId", () => {
    const timeline = buildTimeline({
      runs: [run(), run({ id: "run_2", submissionId: "probe_epoch_2" })],
      messages: [],
    });
    expect(timeline.epochs).toHaveLength(2);
    expect(timeline.epochs[0]?.id).toBe("probe_epoch_1");
    expect(timeline.epochs[1]?.id).toBe("probe_epoch_2");
    expect(timeline.epochs[0]?.rows.map((row) => row.type)).toEqual(["user", "model"]);
    expect(timeline.epochs[0]?.rows[0]?.text).toBe(run().prompt);
  });

  it("keeps a run without a submissionId honest", () => {
    const timeline = buildTimeline({
      runs: [run({ submissionId: null, operationId: null })],
      messages: [],
    });
    expect(timeline.epochs[0]?.submissionId).toBeNull();
    expect(timeline.epochs[0]?.id).toBe("run_1");
  });

  it("treats a repeated request id as the same epoch", () => {
    const timeline = buildTimeline({
      runs: [run(), run({ id: "run_retry", text: "second copy" })],
      messages: [],
    });
    expect(timeline.epochs).toHaveLength(1);
    expect(timeline.epochs[0]?.rows[1]?.text).toBe("second copy");
  });

  it("opens a durable turn on every user row and never invents a submissionId", () => {
    const timeline = buildTimeline({ runs: [], messages: MESSAGES });
    expect(timeline.durableEpochs).toHaveLength(2);
    expect(timeline.durableEpochs[0]?.rows.map((row) => row.type)).toEqual([
      "user",
      "system",
      "model",
    ]);
    expect(timeline.durableEpochs[1]?.rows.map((row) => row.type)).toEqual([
      "user",
      "model",
      "tool-call",
      "tool-result",
    ]);
    expect(timeline.durableEpochs.every((epoch) => epoch.submissionId === null)).toBe(true);
  });

  it("moves a tool marker into its own tool row", () => {
    const timeline = buildTimeline({ runs: [], messages: MESSAGES });
    const toolCall = timeline.durableEpochs[1]?.rows[2];
    expect(toolCall?.type).toBe("tool-call");
    expect(toolCall?.title).toBe("echo");
    expect(toolCall?.category).toBe("other");
    // The marker line itself is represented by the tool row, not repeated.
    expect(timeline.durableEpochs[1]?.rows[1]?.text).not.toContain("tool:echo");
  });

  it("tags the tool categories the console names", () => {
    const messages: MessageEntry[] = [
      { id: 1, kind: "pi.user", preview: "(no text content)" },
      { id: 2, kind: "pi.assistant", preview: "tool:write" },
    ];
    const timeline = buildTimeline({ runs: [], messages });
    expect(timeline.durableEpochs[0]?.rows[2]?.category).toBe("write");
  });

  it("reads the file path and the patch when the backend sends them", () => {
    const messages: MessageEntry[] = [
      { id: 1, kind: "pi.user", preview: "(no text content)" },
      {
        id: 2,
        kind: "pi.tool-result",
        preview: "written",
        filePath: "src/app.ts",
        diff: { before: "a", after: "b" },
      },
    ];
    const timeline = buildTimeline({ runs: [], messages });
    const row = timeline.durableEpochs[0]?.rows[1];
    expect(row?.filePath).toBe("src/app.ts");
    expect(row?.diff).toEqual({ before: "a", after: "b" });
  });

  it("leaves the diff empty when the backend sends no file data", () => {
    const timeline = buildTimeline({ runs: [], messages: MESSAGES });
    const row = timeline.durableEpochs[1]?.rows[2];
    expect(row?.filePath).toBeNull();
    expect(row?.diff).toBeNull();
  });

  it("attaches the turn a prompt appended to that epoch", () => {
    const timeline = buildTimeline({
      runs: [run({ messagesWatermark: 11 })],
      messages: MESSAGES,
    });
    expect(timeline.epochs[0]?.durableRows.map((row) => row.type)).toEqual([
      "user",
      "model",
      "tool-call",
      "tool-result",
    ]);
    expect(timeline.durableEpochs).toHaveLength(1);
  });

  it("leaves turns alone when the browser has no watermark", () => {
    const timeline = buildTimeline({ runs: [run()], messages: MESSAGES });
    expect(timeline.epochs[0]?.durableRows).toEqual([]);
    expect(timeline.durableEpochs).toHaveLength(2);
  });

  it("lines the epochs up with the turns in order, newest with newest", () => {
    const timeline = buildTimeline({
      runs: [
        run({ id: "run_1", submissionId: "sub_1", messagesWatermark: 0 }),
        run({ id: "run_2", submissionId: "sub_2", messagesWatermark: 11 }),
      ],
      messages: MESSAGES,
    });
    expect(timeline.epochs[0]?.durableRows[0]?.messageId).toBe(7);
    expect(timeline.epochs[1]?.durableRows[0]?.messageId).toBe(12);
    expect(timeline.durableEpochs).toHaveLength(0);
  });

  it("appends the in-flight prompt as a running epoch", () => {
    const timeline = buildTimeline({
      runs: [],
      messages: [],
      inflight: { prompt: "in flight", model: null, startedAt: 1 },
    });
    expect(timeline.epochs).toHaveLength(1);
    expect(timeline.epochs[0]?.status).toBe("running");
    expect(timeline.epochs[0]?.rows[0]?.type).toBe("user");
  });
});
