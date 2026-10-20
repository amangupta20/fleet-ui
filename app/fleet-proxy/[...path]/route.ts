import { NextResponse } from "next/server";

import { isAuthEnabled, isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_FLEET_URL = "http://127.0.0.1:9876";

function fleetBaseUrl(): string {
  return (process.env.FLEET_URL?.trim() || DEFAULT_FLEET_URL).replace(/\/+$/, "");
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  if (isAuthEnabled() && !(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized. Unlock Fleet UI to continue." }, { status: 401 });
  }

  if (!["GET", "POST", "HEAD", "OPTIONS"].includes(request.method)) {
    return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
  }

  const { path } = await context.params;
  // Next hands us decoded segments; encode each one so names with spaces or
  // unicode round-trip to the Worker exactly as the browser sent them.
  const upstreamPath = (path ?? []).map((segment) => encodeURIComponent(segment)).join("/");
  const incomingUrl = new URL(request.url);
  // Generic passthrough covers /health, /models, and GET /agents. The latter
  // keeps its limit/prefix query string on the way to the Registry DO.
  const target = `${fleetBaseUrl()}/${upstreamPath}${incomingUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", accept ?? "application/json");

  try {
    const method = request.method;
    const hasBody = method !== "GET" && method !== "HEAD";
    const response = await fetch(target, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(600_000),
    });

    const responseHeaders = new Headers();
    const upstreamType = response.headers.get("content-type");
    if (upstreamType) responseHeaders.set("content-type", upstreamType);
    responseHeaders.set("cache-control", "no-store, max-age=0");
    responseHeaders.set("x-fleet-ui-proxy", "1");

    if (method === "HEAD") {
      return new Response(null, { status: response.status, headers: responseHeaders });
    }

    const body = await response.arrayBuffer();
    return new Response(body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    // Do not echo FLEET_URL to the browser: it may be a private address.
    console.error("[fleet-proxy] upstream request failed", { target, timedOut, error });
    const message = timedOut
      ? "The fleet Worker did not answer within 10 minutes."
      : "Could not reach the fleet Worker. Check the server's FLEET_URL and that celld dev is running.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function HEAD(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return proxy(request, context);
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { allow: "GET, POST, OPTIONS" } });
}
