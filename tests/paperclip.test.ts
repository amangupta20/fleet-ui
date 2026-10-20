import { describe, expect, it } from "vitest";

import {
  normalizePaperclipAgents,
  paperclipAgentsUrl,
  resolvePaperclipConfig,
} from "@/lib/paperclip";

describe("paperclip directory", () => {
  it("normalizes wrapped agent objects to name/lastActive/source", () => {
    const agents = normalizePaperclipAgents({
      agents: [
        { name: "Atlas", lastHeartbeatAt: "2026-10-20T10:00:00.000Z" },
        { displayName: "Designer", urlKey: "designer" },
        { id: "worker-1", name: "Worker" },
        { name: "Atlas" },
      ],
    });

    expect(agents).toEqual([
      { name: "Atlas", lastActive: "2026-10-20T10:00:00.000Z", source: "paperclip" },
      { name: "Designer", source: "paperclip" },
      { name: "Worker", source: "paperclip" },
    ]);
  });

  it("accepts a bare array and tolerates bare strings", () => {
    expect(normalizePaperclipAgents(["uno", { name: "dos" }])).toEqual([
      { name: "uno", source: "paperclip" },
      { name: "dos", source: "paperclip" },
    ]);
  });

  it("requires both env values and resolves /api/agents once", () => {
    expect(resolvePaperclipConfig({})).toBeNull();
    expect(resolvePaperclipConfig({ PAPERCLIP_URL: "https://pc.example" })).toBeNull();
    expect(
      resolvePaperclipConfig({
        PAPERCLIP_URL: "https://pc.example/",
        PAPERCLIP_API_KEY: "secret",
      }),
    ).toMatchObject({ agentsUrl: "https://pc.example/api/agents" });
    expect(
      resolvePaperclipConfig({
        PAPERCLIP_URL: "https://pc.example/api",
        PAPERCLIP_API_KEY: "secret",
      }),
    ).toMatchObject({ agentsUrl: "https://pc.example/api/agents" });
    expect(paperclipAgentsUrl("https://pc.example/api/companies/acme/agents")).toBe(
      "https://pc.example/api/companies/acme/agents",
    );
  });
});
