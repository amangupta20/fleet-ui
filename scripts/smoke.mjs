#!/usr/bin/env node
/**
 * End-to-end smoke test for a running Fleet UI instance.
 *
 * Exercises the same-origin proxy that the browser uses:
 *   GET  /api/health
 *   GET  /api/models
 *   GET  /api/agent/:name/state
 *   GET  /api/agent/:name/messages
 *   POST /api/agent/:name/prompt   (with --prompt)
 *   POST /api/agent/:name/reset    (with --reset)
 *
 * Usage:
 *   node scripts/smoke.mjs
 *   node scripts/smoke.mjs --prompt "say hi"
 *   FLEET_UI_PASSWORD=... node scripts/smoke.mjs --prompt "say hi"
 *   FLEET_UI_URL=http://127.0.0.1:3000 node scripts/smoke.mjs
 */

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Fleet UI smoke test

Env:
  FLEET_UI_URL       default http://127.0.0.1:3000
  FLEET_UI_PASSWORD  optional; unlocks and reuses the session cookie

Flags:
  --prompt [text]    run a real prompt (default: "Reply with exactly: fleet-ui smoke ok.")
  --agent <name>     default "ui-smoke"
  --reset            reset the agent at the end
  --help             show this help
`);
  process.exit(0);
}

function flagValue(flag, fallback) {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : fallback;
}

const baseUrl = (process.env.FLEET_UI_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const password = process.env.FLEET_UI_PASSWORD?.trim();
const agent = flagValue("--agent", "ui-smoke");
const promptFlagIndex = args.indexOf("--prompt");
const wantsPrompt = promptFlagIndex !== -1;
const prompt = flagValue("--prompt", "Reply with exactly: fleet-ui smoke ok. Do not use tools.");
const shouldReset = args.includes("--reset");
let cookie = "";

function line(status, message) {
  console.log(`${status === "ok" ? "✓" : status === "skip" ? "–" : "✗"} ${message}`);
}

async function request(path, options = {}) {
  const headers = { accept: "application/json", ...(options.headers || {}) };
  if (cookie) headers.cookie = cookie;
  if (options.body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    redirect: "manual",
  });
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length > 0) {
    const session = setCookies.find((value) => value.startsWith("fleet_ui_session="));
    if (session) cookie = session.split(";")[0];
  }
  const type = response.headers.get("content-type") || "";
  const body = type.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");
  return { response, body, type };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function unlock() {
  if (!password) {
    line("skip", "FLEET_UI_PASSWORD not set (assuming the gate is off)");
    return;
  }
  const { response, body } = await request("/auth/unlock", {
    method: "POST",
    body: { password },
  });
  assert(response.ok, `unlock failed: HTTP ${response.status} ${body?.error ?? ""}`.trim());
  line("ok", "password gate unlocked (HttpOnly session cookie)");
}

async function main() {
  console.log(`Fleet UI smoke → ${baseUrl}\n`);
  await unlock();

  const health = await request("/api/health");
  assert(health.response.ok, `health failed: HTTP ${health.response.status}`);
  assert(String(health.body).trim() === "ok", `health returned ${JSON.stringify(health.body)}`);
  line("ok", "GET /api/health → ok");

  const models = await request("/api/models");
  assert(models.response.ok, `models failed: HTTP ${models.response.status}`);
  assert(Array.isArray(models.body.catalog), "/models is missing catalog[]");
  assert(models.body.default === null || typeof models.body.default.id === "string", "/models default shape");
  line(
    "ok",
    `GET /api/models → ${models.body.catalog.length} models, default ${
      models.body.default ? `${models.body.default.provider}/${models.body.default.id}` : "unset"
    }, router live ${models.body.router?.live === null ? "no" : `${models.body.router?.live?.length ?? 0} ids`}`,
  );

  const state = await request(`/api/agent/${encodeURIComponent(agent)}/state`);
  assert(state.response.ok, `state failed: HTTP ${state.response.status}`);
  assert(state.body.resident === true, "state is missing resident:true");
  line("ok", `GET /api/agent/${agent}/state → reachable`);

  if (wantsPrompt) {
    const requestId = `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const started = performance.now();
    const first = await request(`/api/agent/${encodeURIComponent(agent)}/prompt`, {
      method: "POST",
      body: { prompt, requestId },
    });
    const elapsed = Math.round(performance.now() - started);
    assert(first.response.ok, `prompt failed: HTTP ${first.response.status} ${first.body?.error ?? ""}`.trim());
    assert(typeof first.body.text === "string", "prompt response is missing text");
    assert(typeof first.body.submissionId === "string", "prompt response is missing submissionId");
    assert(
      first.body.operationId === first.body.submissionId,
      "operationId and submissionId should match",
    );
    assert(["done", "unanswered"].includes(first.body.status), `unexpected status ${first.body.status}`);
    line(
      "ok",
      `POST prompt → ${first.body.status} in ${elapsed}ms, operation ${first.body.operationId}${first.body.reason ? `, reason ${first.body.reason}` : ""}`,
    );
    if (first.body.text) line("ok", `response text: ${JSON.stringify(first.body.text.slice(0, 140))}`);

    const second = await request(`/api/agent/${encodeURIComponent(agent)}/prompt`, {
      method: "POST",
      body: { prompt, requestId },
    });
    assert(second.response.ok, `idempotent retry failed: HTTP ${second.response.status}`);
    assert(second.body.submissionId === first.body.submissionId, "idempotent retry returned a different run");
    line("ok", "same requestId → same operation (idempotency)");
  } else {
    line("skip", "real prompt skipped (pass --prompt)");
  }

  const messages = await request(`/api/agent/${encodeURIComponent(agent)}/messages?limit=10`);
  assert(messages.response.ok, `messages failed: HTTP ${messages.response.status}`);
  assert(Array.isArray(messages.body.messages), "/messages is missing messages[]");
  line("ok", `GET messages → ${messages.body.messages.length} entries`);

  if (shouldReset) {
    const reset = await request(`/api/agent/${encodeURIComponent(agent)}/reset`, { method: "POST" });
    assert(reset.response.ok && reset.body.reset === true, "reset did not return reset:true");
    line("ok", `POST reset → ${agent} context cleared`);
  }

  console.log("\nAll smoke checks passed.");
}

main().catch((error) => {
  line("fail", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
