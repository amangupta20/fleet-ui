#!/usr/bin/env node
/**
 * End-to-end smoke test for a running Fleet UI instance.
 *
 * Exercises the same-origin proxy that the browser uses:
 *   GET  /api/health
 *   GET  /api/models
 *   GET  /api/agents?limit=&prefix=
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
  --unicode-agent <name>
                     default "<agent>-λ agent" (spaces + unicode path case)
  --reset            reset the prompt agents at the end
  --help             show this help

With --prompt, verifies GET /agents after the prompt + idempotent retry,
then exercises a unicode/space name end-to-end.
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
const unicodeAgent = flagValue("--unicode-agent", `${agent}-λ agent`);
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

async function fetchAgents(query = "") {
  const result = await request(`/api/agents${query}`);
  assert(result.response.ok, `agents failed: HTTP ${result.response.status} ${result.body?.error ?? ""}`.trim());
  assert(Array.isArray(result.body?.agents), "/agents is missing agents[]");
  assert(typeof result.body?.count === "number", "/agents is missing count");
  assert(result.body.count === result.body.agents.length, "/agents count does not match agents[]");
  return result.body.agents;
}

function findAgent(agents, name) {
  return agents.find((entry) => entry?.name === name);
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

  const initialAgents = await fetchAgents("?limit=200");
  line("ok", `GET /api/agents → ${initialAgents.length} known agent${initialAgents.length === 1 ? "" : "s"}`);

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

    // Two prompt POSTs have touched the Registry at this point. The proxy must
    // forward limit/prefix and the server must list the decoded name.
    const indexed = await fetchAgents(
      `?limit=200&prefix=${encodeURIComponent(agent)}`,
    );
    const indexedAgent = findAgent(indexed, agent);
    assert(indexedAgent, `/agents did not list "${agent}" after two prompts`);
    assert(
      indexedAgent.prompts >= 2,
      `/agents reports ${indexedAgent.prompts} prompt(s) after two POSTs; update fleet-base to 7eb7e7b or later`,
    );
    line(
      "ok",
      `GET /api/agents?limit=200&prefix=… → ${indexed.length} match(es), ${agent} prompts=${indexedAgent.prompts}`,
    );

    // Unicode + space name end-to-end: encode the path, prompt, read state and
    // messages, then verify the registry returns the exact decoded name.
    const unicodeRequestId = `smoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const unicodePath = `/api/agent/${encodeURIComponent(unicodeAgent)}`;
    const unicodeState = await request(`${unicodePath}/state`);
    assert(unicodeState.response.ok, `unicode state failed: HTTP ${unicodeState.response.status}`);
    const unicodePrompt = await request(`${unicodePath}/prompt`, {
      method: "POST",
      body: {
        prompt: "Reply with exactly: unicode smoke ok. Do not use tools.",
        requestId: unicodeRequestId,
      },
    });
    assert(
      unicodePrompt.response.ok,
      `unicode prompt failed: HTTP ${unicodePrompt.response.status} ${unicodePrompt.body?.error ?? ""}`.trim(),
    );
    assert(typeof unicodePrompt.body.text === "string", "unicode prompt response is missing text");
    line("ok", `unicode/space agent prompt → ${JSON.stringify(unicodeAgent)}`);
    const unicodeMessages = await request(`${unicodePath}/messages?limit=10`);
    assert(
      unicodeMessages.response.ok,
      `unicode messages failed: HTTP ${unicodeMessages.response.status}`,
    );
    assert(
      Array.isArray(unicodeMessages.body.messages),
      "unicode /messages is missing messages[]",
    );
    const allAgents = await fetchAgents("?limit=200");
    const unicodeEntry = findAgent(allAgents, unicodeAgent);
    assert(unicodeEntry, `/agents did not return the exact unicode name ${JSON.stringify(unicodeAgent)}`);
    line(
      "ok",
      `GET /api/agents → exact unicode name (${unicodeEntry.prompts} prompt${unicodeEntry.prompts === 1 ? "" : "s"})`,
    );
  } else {
    line("skip", "real prompt skipped (pass --prompt)");
    line("skip", "unicode/space prompt case skipped (pass --prompt)");
  }

  const messages = await request(`/api/agent/${encodeURIComponent(agent)}/messages?limit=10`);
  assert(messages.response.ok, `messages failed: HTTP ${messages.response.status}`);
  assert(Array.isArray(messages.body.messages), "/messages is missing messages[]");
  line("ok", `GET messages → ${messages.body.messages.length} entries`);

  if (shouldReset) {
    const resetNames = wantsPrompt ? [agent, unicodeAgent] : [agent];
    for (const name of resetNames) {
      const reset = await request(`/api/agent/${encodeURIComponent(name)}/reset`, { method: "POST" });
      assert(reset.response.ok && reset.body.reset === true, `reset failed for ${name}`);
      line("ok", `POST reset → ${name} context cleared`);
    }
  }

  console.log("\nAll smoke checks passed.");
}

main().catch((error) => {
  line("fail", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
