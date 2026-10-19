import { describe, expect, it } from "vitest";

import {
  AUTH_COOKIE_MAX_AGE,
  createSessionToken,
  safeCompare,
  sanitizeNextPath,
  verifySessionToken,
} from "@/lib/auth-token";

const NOW = 1_700_000_000_000;

describe("session tokens", () => {
  it("creates and verifies an HMAC session", () => {
    const token = createSessionToken("secret", NOW);
    expect(token.startsWith("v1.")).toBe(true);
    expect(verifySessionToken(token, "secret", NOW + 1000)).toBe(true);
    expect(verifySessionToken(token, "other", NOW + 1000)).toBe(false);
    expect(verifySessionToken(token, "secret", NOW + AUTH_COOKIE_MAX_AGE * 1000 + 1)).toBe(false);
    expect(verifySessionToken(undefined, "secret", NOW)).toBe(false);
  });

  it("rejects tampered tokens", () => {
    const token = createSessionToken("secret", NOW);
    const tampered = token.replace(/\.[0-9a-f]{8}/, ".deadbeef");
    expect(verifySessionToken(tampered, "secret", NOW + 1)).toBe(false);
    expect(verifySessionToken("v1.123", "secret", NOW + 1)).toBe(false);
  });

  it("compares passwords in constant time", () => {
    expect(safeCompare("secret", "secret")).toBe(true);
    expect(safeCompare("secret", "secrex")).toBe(false);
    expect(safeCompare("", "secret")).toBe(false);
  });

  it("sanitizes post-login redirects", () => {
    expect(sanitizeNextPath("/providers")).toBe("/providers");
    expect(sanitizeNextPath("https://evil.example")).toBe("/");
    expect(sanitizeNextPath("//evil.example")).toBe("/");
    expect(sanitizeNextPath("/unlock?next=/")).toBe("/");
    expect(sanitizeNextPath(undefined)).toBe("/");
  });
});
