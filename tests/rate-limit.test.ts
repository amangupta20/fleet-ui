import { describe, expect, it } from "vitest";

import { checkRateLimit } from "@/lib/rate-limit";

describe("login rate limit", () => {
  it("allows ten attempts then blocks within the window", () => {
    const key = `test-${Math.random()}`;
    const start = 1_700_000_000_000;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(checkRateLimit(key, start + attempt).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, start + 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window", () => {
    const key = `test-${Math.random()}`;
    const start = 1_700_000_000_000;
    for (let attempt = 0; attempt < 11; attempt += 1) checkRateLimit(key, start);
    expect(checkRateLimit(key, start + 11 * 60 * 1000).allowed).toBe(true);
  });
});
