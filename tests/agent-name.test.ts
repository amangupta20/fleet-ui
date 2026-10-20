import { describe, expect, it } from "vitest";

import {
  agentPath,
  decodeAgentName,
  normalizeAgentName,
  validateAgentName,
} from "@/lib/agent-name";

describe("agent names", () => {
  it("trims and normalizes valid names", () => {
    expect(normalizeAgentName("  alice  ")).toBe("alice");
    expect(validateAgentName("  alice  ")).toEqual({ ok: true, name: "alice" });
  });

  it("accepts spaces, dots, dashes, and unicode", () => {
    for (const name of ["repo-review", "prod.oncall", "team agent", "agent-λ"]) {
      expect(validateAgentName(name).ok).toBe(true);
    }
  });

  it("rejects empty, long, path-like, and control-character names", () => {
    expect(validateAgentName("   ").ok).toBe(false);
    expect(validateAgentName("a".repeat(65)).ok).toBe(false);
    expect(validateAgentName("a/b").ok).toBe(false);
    expect(validateAgentName("a\\b").ok).toBe(false);
    expect(validateAgentName("a?b").ok).toBe(false);
    expect(validateAgentName("a#b").ok).toBe(false);
    expect(validateAgentName("a\u0000b").ok).toBe(false);
  });

  it("encodes agent names into Worker paths", () => {
    expect(agentPath("my agent", "/state")).toBe("/api/agent/my%20agent/state");
    expect(agentPath("a+b")).toBe("/api/agent/a%2Bb");
  });

  it("decodes display names without throwing on malformed escapes", () => {
    expect(decodeAgentName("my%20agent")).toBe("my agent");
    expect(decodeAgentName("smoke-%CE%BB%20agent")).toBe("smoke-λ agent");
    expect(decodeAgentName("100%")).toBe("100%");
    expect(decodeAgentName("plain")).toBe("plain");
  });
});
