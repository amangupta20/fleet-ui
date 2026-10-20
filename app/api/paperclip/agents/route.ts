import { NextResponse } from "next/server";

import { isAuthEnabled, isAuthenticated } from "@/lib/auth";
import { normalizePaperclipAgents, resolvePaperclipConfig } from "@/lib/paperclip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store, max-age=0" } as const;
const UPSTREAM_TIMEOUT_MS = 15_000;

/** Logs identify the host without exposing credentials or a private path. */
function upstreamHost(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return "paperclip";
  }
}

function disabled(): NextResponse {
  // Same shape as a successful list, so the client needs no special case.
  return NextResponse.json([], {
    headers: { ...NO_STORE, "x-paperclip-enabled": "0" },
  });
}

function upstreamError(message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 502, headers: { ...NO_STORE, "x-paperclip-enabled": "1" } },
  );
}

/**
 * Optional Paperclip agent directory.
 *
 * The browser calls this same-origin route; only this server-side handler sees
 * `PAPERCLIP_URL` / `PAPERCLIP_API_KEY`. It never proxies to `FLEET_URL`, never
 * forwards browser cookies, and never echoes the configured URL or key.
 *
 * The response is normalized to `[{name, lastActive?, source:"paperclip"}]`.
 * When either env value is unset the route answers 200 with `[]` so the rail
 * hides the section without surfacing an error.
 */
export async function GET(): Promise<Response> {
  if (isAuthEnabled() && !(await isAuthenticated())) {
    return NextResponse.json(
      { error: "Unauthorized. Unlock Fleet UI to continue." },
      { status: 401, headers: NO_STORE },
    );
  }

  const config = resolvePaperclipConfig();
  if (!config) return disabled();

  let response: Response;
  try {
    response = await fetch(config.agentsUrl, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    console.error("[paperclip] upstream request failed", {
      target: upstreamHost(config.baseUrl),
      timedOut,
      error,
    });
    return upstreamError(
      timedOut
        ? "Paperclip did not answer in time. Check the server's PAPERCLIP_URL."
        : "Could not reach Paperclip. Check the server's PAPERCLIP_URL.",
    );
  }

  if (!response.ok) {
    // Do not echo an upstream body: it can contain control-plane details.
    console.error("[paperclip] upstream returned an error", {
      target: upstreamHost(config.baseUrl),
      status: response.status,
    });
    return upstreamError(`Paperclip returned HTTP ${response.status}.`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    console.error("[paperclip] upstream returned invalid JSON", {
      target: upstreamHost(config.baseUrl),
    });
    return upstreamError("Paperclip returned an invalid agent list.");
  }

  const agents = normalizePaperclipAgents(payload);
  return NextResponse.json(agents, {
    headers: { ...NO_STORE, "x-paperclip-enabled": "1" },
  });
}
