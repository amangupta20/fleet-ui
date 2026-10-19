import { describe, expect, it } from "vitest";

import { generateRequestId, isValidRequestId } from "@/lib/request-id";

describe("request ids", () => {
  it("generates prefixed, unique UUID-like ids", () => {
    const first = generateRequestId();
    const second = generateRequestId();
    expect(first.startsWith("req_")).toBe(true);
    expect(second.startsWith("req_")).toBe(true);
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThan(20);
    expect(isValidRequestId(first)).toBe(true);
  });

  it("supports custom prefixes", () => {
    expect(generateRequestId("smoke").startsWith("smoke_")).toBe(true);
  });

  it("validates characters and length", () => {
    expect(isValidRequestId("req_abc-123.test")).toBe(true);
    expect(isValidRequestId("a/b:c=d_e")).toBe(true);
    expect(isValidRequestId("")).toBe(false);
    expect(isValidRequestId("has space")).toBe(false);
    expect(isValidRequestId("a".repeat(201))).toBe(false);
  });
});
