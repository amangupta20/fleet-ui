import { cookies } from "next/headers";

import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  createSessionToken,
  safeCompare,
  sanitizeNextPath,
  verifySessionToken,
} from "./auth-token";

export {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  createSessionToken,
  safeCompare,
  sanitizeNextPath,
};

export function isAuthEnabled(): boolean {
  return Boolean(process.env.FLEET_UI_PASSWORD?.trim());
}

function getPassword(): string | null {
  const value = process.env.FLEET_UI_PASSWORD?.trim();
  return value ? value : null;
}

export async function isAuthenticated(): Promise<boolean> {
  const password = getPassword();
  if (!password) return true;
  const store = await cookies();
  return verifySessionToken(store.get(AUTH_COOKIE_NAME)?.value, password);
}

export function isSecureRequest(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0]?.trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}
