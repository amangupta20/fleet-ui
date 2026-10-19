import { describe, expect, it } from "vitest";

import {
  errorMessage,
  formatCompactNumber,
  formatDuration,
  safeFileStem,
  shortId,
  truncate,
} from "@/lib/utils";
import { modelRefToString, parseModelRef, providerLabel, sameModel } from "@/lib/model";

describe("formatting", () => {
  it("formats latency", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(250)).toBe("250 ms");
    expect(formatDuration(2530)).toBe("2.53 s");
    expect(formatDuration(12_400)).toBe("12.4 s");
    expect(formatDuration(65_000)).toBe("1m 5s");
  });

  it("formats compact numbers", () => {
    expect(formatCompactNumber(1_048_576)).toBe("1M");
    expect(formatCompactNumber(131_072)).toBe("131.1K");
    expect(formatCompactNumber(undefined)).toBe("—");
  });

  it("shortens ids", () => {
    expect(shortId("req_1234567890", 8)).toBe("req_1234…");
    expect(shortId("short", 8)).toBe("short");
    expect(shortId(null)).toBe("—");
  });

  it("makes safe file stems", () => {
    expect(safeFileStem("my agent / main")).toBe("my-agent-main");
    expect(safeFileStem("...")).toBe("agent");
  });

  it("truncates and extracts errors", () => {
    expect(truncate("abcdef", 4)).toBe("abc…");
    expect(truncate("abc", 4)).toBe("abc");
    expect(errorMessage(new Error("boom"))).toBe("boom");
    expect(errorMessage("boom")).toBe("boom");
  });
});

describe("model refs", () => {
  it("round-trips provider/id", () => {
    expect(modelRefToString({ provider: "router", id: "llama" })).toBe("router/llama");
    expect(parseModelRef("router/llama")).toEqual({ provider: "router", id: "llama" });
    expect(parseModelRef("router/org/llama")).toEqual({ provider: "router", id: "org/llama" });
    expect(parseModelRef("nope")).toBeNull();
    expect(parseModelRef("/x")).toBeNull();
    expect(parseModelRef("x/")).toBeNull();
  });

  it("compares refs and labels providers", () => {
    expect(sameModel({ provider: "a", id: "b" }, { provider: "a", id: "b" })).toBe(true);
    expect(sameModel({ provider: "a", id: "b" }, { provider: "a", id: "c" })).toBe(false);
    expect(providerLabel("router")).toBe("Custom router");
    expect(providerLabel("unknown")).toBe("unknown");
  });
});
