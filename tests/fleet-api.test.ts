import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchServerAgents } from "@/lib/fleet-api";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("server agent directory fetch", () => {
  it("requests /api/agents?limit=200 and normalizes the list", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        agents: [
          { name: "alice", lastActive: "2026-10-20T10:00:00.000Z", prompts: 3 },
          { name: "alice", lastActive: "2026-10-20T09:00:00.000Z", prompts: 1 },
          { name: "unicode λ agent", lastActive: "", prompts: 0 },
        ],
        count: 3,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const agents = await fetchServerAgents();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agents?limit=200",
      expect.objectContaining({ method: "GET" }),
    );
    expect(agents).toEqual([
      { name: "alice", lastActive: "2026-10-20T10:00:00.000Z", prompts: 3 },
      { name: "unicode λ agent", lastActive: "", prompts: 0 },
    ]);
  });

  it("falls back to [] on a sanitized 502", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Could not reach the fleet Worker." }, 502)),
    );

    await expect(fetchServerAgents()).resolves.toEqual([]);
  });

  it("falls back to [] on an offline/network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    await expect(fetchServerAgents()).resolves.toEqual([]);
  });
});
