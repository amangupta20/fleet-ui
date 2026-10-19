import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  createSessionToken,
  isSecureRequest,
  safeCompare,
  sanitizeNextPath,
} from "@/lib/auth";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const password = process.env.FLEET_UI_PASSWORD?.trim();
  if (!password) {
    return NextResponse.json(
      { error: "Password protection is not enabled on this Fleet UI." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const received = typeof (body as { password?: unknown })?.password === "string"
    ? ((body as { password: string }).password)
    : "";
  const next = sanitizeNextPath((body as { next?: unknown })?.next);

  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "retry-after": String(limit.retryAfterSeconds) },
      },
    );
  }

  if (!received || !safeCompare(received, password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = createSessionToken(password);
  const response = NextResponse.json({ ok: true, next });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
  return response;
}
