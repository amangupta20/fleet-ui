import { describe, expect, it } from "vitest";

import type { ChatRun } from "@/lib/chat-types";
import { buildJsonExport, buildMarkdownExport, buildPlainTranscript } from "@/lib/export";

const run: ChatRun = {
  id: "local-1",
  prompt: "say hi",
  requestId: "req_123",
  model: "router/test",
  text: "hi there",
  status: "done",
  reason: null,
  submissionId: "req_123",
  operationId: "req_123",
  latencyMs: 2500,
  createdAt: 1_700_000_000_000,
  error: null,
  httpStatus: 200,
};

describe("transcript export", () => {
  it("builds a useful markdown transcript", () => {
    const markdown = buildMarkdownExport({ agent: "alice", exportedAt: 1_700_000_100_000, runs: [run] });
    expect(markdown).toContain("# Fleet transcript — alice");
    expect(markdown).toContain("requestId: `req_123`");
    expect(markdown).toContain("model: `router/test`");
    expect(markdown).toContain("say hi");
    expect(markdown).toContain("hi there");
    expect(markdown).toContain("Done");
  });

  it("includes server message previews", () => {
    const markdown = buildMarkdownExport({
      agent: "alice",
      exportedAt: 1,
      runs: [],
      serverMessages: [{ id: 7, kind: "pi.assistant", preview: "durable answer" }],
    });
    expect(markdown).toContain("Durable transcript");
    expect(markdown).toContain("durable answer");
  });

  it("builds stable JSON", () => {
    const json = JSON.parse(
      buildJsonExport({ agent: "alice", exportedAt: 1_700_000_100_000, runs: [run] }),
    ) as { format: string; agent: string; runs: ChatRun[] };
    expect(json.format).toBe("fleet-ui/transcript@1");
    expect(json.agent).toBe("alice");
    expect(json.runs[0]?.requestId).toBe("req_123");
  });

  it("builds a plain transcript", () => {
    expect(buildPlainTranscript([run])).toBe("You:\nsay hi\n\nFleet:\nhi there");
  });
});
