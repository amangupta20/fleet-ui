import { describe, expect, it } from "vitest";

import { mergeAgentRows } from "@/lib/agent-merge";
import type { AgentRecord, PaperclipAgent, ServerAgent } from "@/lib/fleet-types";

function local(name: string, addedAt = 1_700_000_000_000): AgentRecord {
  return { name, addedAt, modelOverride: null, label: null, starred: false };
}

function fleet(name: string, lastActive: string, prompts = 1): ServerAgent {
  return { name, lastActive, prompts };
}

function paperclip(name: string, lastActive?: string): PaperclipAgent {
  return { name, source: "paperclip", ...(lastActive ? { lastActive } : {}) };
}

describe("merged agent directory", () => {
  it("collapses a duplicate across all three sources into one fleet row", () => {
    const rows = mergeAgentRows({
      server: [fleet("shared", "2026-10-20T10:00:00.000Z", 7)],
      paperclip: [paperclip("shared", "2026-10-21T10:00:00.000Z")],
      local: [local("shared")],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "shared",
      source: "fleet",
      lastActive: "2026-10-20T10:00:00.000Z",
      prompts: 7,
    });
    expect(rows[0]?.local?.name).toBe("shared");
  });

  it("orders fleet by lastActive desc, then paperclip, then local-only", () => {
    const rows = mergeAgentRows({
      server: [
        fleet("older", "2026-10-19T10:00:00.000Z"),
        fleet("newer", "2026-10-20T10:00:00.000Z"),
      ],
      paperclip: [
        paperclip("paperclip-b", "2026-10-18T10:00:00.000Z"),
        paperclip("paperclip-a", "2026-10-20T12:00:00.000Z"),
      ],
      local: [local("local-only", 1_700_000_000_000)],
    });

    expect(rows.map((row) => [row.name, row.source])).toEqual([
      ["newer", "fleet"],
      ["older", "fleet"],
      ["paperclip-a", "paperclip"],
      ["paperclip-b", "paperclip"],
      ["local-only", "local"],
    ]);
  });

  it("keeps paperclip over a local duplicate and dedupes local recents", () => {
    const rows = mergeAgentRows({
      paperclip: [paperclip("dupe", "2026-10-20T12:00:00.000Z")],
      local: [local("dupe", 1), local("dupe", 2), local("solo", 3)],
    });

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.name === "dupe")?.source).toBe("paperclip");
    expect(rows.find((row) => row.name === "solo")?.source).toBe("local");
  });
});
