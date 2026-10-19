import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE_NAME = "fleet_ui_session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(expiresAt: number, password: string): string {
  return createHmac("sha256", `fleet-ui:${password}`)
    .update(`v1.${expiresAt}`)
    .digest("hex");
}

export function createSessionToken(password: string, now = Date.now()): string {
  const expiresAt = now + AUTH_COOKIE_MAX_AGE * 1000;
  return `v1.${expiresAt}.${sign(expiresAt, password)}`;
}

export function verifySessionToken(
  token: string | undefined,
  password: string,
  now = Date.now(),
): boolean {
  if (!password || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, expiresRaw, signature] = parts;
  if (version !== "v1" || !expiresRaw || !signature) return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;
  const expected = sign(expiresAt, password);
  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function safeCompare(received: string, expected: string): boolean {
  // Hash first so comparison length never depends on the supplied input.
  const a = createHash("sha256").update(received).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function sanitizeNextPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/unlock")) return "/";
  return value;
}
