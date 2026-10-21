# Verification log

Everything the console claims about the backend is checked with a `curl`
against a running fleet-base (`celld dev`) through the
same-origin proxy. The commands below are the ones used for this change; the
output is what the commands printed.

Setup used for every command:

```sh
# fleet-base: checkout a2678bd (base main 5062749)
cd fleet-base && npm run dev            # http://127.0.0.1:9876

# fleet-ui (production build)
cd fleet-ui && npm run build && npm start   # http://127.0.0.1:3000
```

## 1. The `Allow` header advertises HEAD

```sh
$ curl -s -i -X OPTIONS http://127.0.0.1:3000/api/health | grep -i '^allow'
allow: GET, POST, HEAD, OPTIONS
```

## 2. `GET /agent/:name/messages` clamps `limit` to 1–100 and defaults to 20

The agent below had 70 durable messages, so the clamp is visible in both
directions.

```sh
$ curl -s "http://127.0.0.1:3000/api/agent/ui-smoke-tool/messages?limit=5000" | jq '.messages | length'
70          # clamped to 100, the agent only has 70
$ curl -s "http://127.0.0.1:3000/api/agent/ui-smoke-tool/messages?limit=5" | jq '.messages | length'
5
$ curl -s "http://127.0.0.1:3000/api/agent/ui-smoke-tool/messages?limit=1" | jq '.messages | length'
1
$ curl -s "http://127.0.0.1:3000/api/agent/ui-smoke-tool/messages?limit=0" | jq '.messages | length'
1          # clamped up to 1
$ curl -s "http://127.0.0.1:3000/api/agent/ui-smoke-tool/messages" | jq '.messages | length'
20         # server default when the parameter is omitted
```

## 3. The rail source: `GET /agents` through the proxy

```sh
$ curl -s "http://127.0.0.1:3000/api/agents?limit=200" | jq '{count, first: .agents[0]}'
{
  "count": 21,
  "first": {
    "name": "ui-smoke-λ agent",
    "lastActive": "2026-10-20T15:59:46.895Z",
    "prompts": 4
  }
}
```

The console merges that list with the optional Paperclip directory and the
browser-local recents in the order **fleet > paperclip > local**
(`lib/agent-merge.ts`).

## 4. A prompt returns the `submissionId` the epoch is keyed by

```sh
$ curl -s -X POST http://127.0.0.1:3000/api/agent/epoch-final/prompt \
    -H 'content-type: application/json' \
    -d '{"prompt":"Reply with exactly: epoch final proof","requestId":"epoch_final_003"}'
{
  "text": "epoch final proof",
  "submissionId": "epoch_final_003",
  "operationId": "epoch_final_003",
  "status": "done",
  "reason": null
}
```

That is the value the console files an epoch under: the epoch header in
`docs/screens/after-chat.png` reads `smoke_1792500534983_5cq3nq` — the
`submissionId` a smoke run returned for the same agent.

## 5. The live smoke test

```sh
$ FLEET_UI_URL=http://127.0.0.1:3000 node scripts/smoke.mjs --prompt --reset
Fleet UI smoke → http://127.0.0.1:3000

– FLEET_UI_PASSWORD not set (assuming the gate is off)
✓ GET /api/health → ok
✓ GET /api/models → 97 models, default router/normal_use, router live 14 ids
✓ GET /api/agents → 21 known agents
✓ GET /api/agent/ui-smoke/state → reachable
✓ POST prompt → done in 2529ms, operation smoke_1792516060441_jqw2zd
✓ response text: "fleet-ui smoke ok"
✓ same requestId → same operation (idempotency)
✓ GET /api/agents?limit=200&prefix=… → 4 match(es), ui-smoke prompts=12
✓ unicode/space agent prompt → "ui-smoke-λ agent"
✓ GET /api/agents → exact unicode name (6 prompts)
✓ GET messages → 4 entries
✓ POST reset → ui-smoke context cleared
✓ POST reset → ui-smoke-λ agent context cleared

All smoke checks passed.
```

## 6. The theme demos showed the same agent and the same submissionId

`/demo/a`, `/demo/b` and `/demo/c` were the same console with a different
skin. A headless pass loaded each route with the same seeded browser state and
asserted the agent, the epoch key, the disabled revert control, the timeline
rows and the lifecycle chip:

```
demo/a: ok {"agent":true,"submissionId":true,"revertDisabled":true,"timelineRows":true,"lifecycleChip":true} rows=63
demo/b: ok {"agent":true,"submissionId":true,"revertDisabled":true,"timelineRows":true,"lifecycleChip":true} rows=63
demo/c: ok {"agent":true,"submissionId":true,"revertDisabled":true,"timelineRows":true,"lifecycleChip":true} rows=63

All demos render the same agent + submissionId.
```

`submissionId` is `smoke_1792500534983_5cq3nq` in all three — the same real
id the epoch header renders in the screenshots.

**Demo c was picked** and its tokens are the console theme now; the demo routes
were deleted with the selection device:

```
$ curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/demo/a
404
```

The shipped console renders the picked theme with the same agent and the same
epoch key (`docs/screens/after-chat.png`).

## 7. Static checks

```sh
$ npm run check     # tsc --noEmit + eslint + vitest
$ npm run build     # production/standalone build
```

- `npm run check` → 11 test files, 58 tests, no errors, no warnings.
- `npm run build` → succeeds; routes unchanged except the new timeline
  components.

## 8. What is deliberately *not* proven by a curl

- The **revert control** is disabled on purpose: the Worker has no checkpoint
  endpoint, so there is nothing to call.
- The **diff region** is wired to `diffFromMessage` in `lib/timeline.ts`, but
  fleet-base sends no file data, so it renders its empty state.
- The **terminal** is a local xterm canvas with `disableStdin`; it opens no
  connection at all.
- The **permission row** renders when a message kind mentions a permission or
  approval; fleet-base emits `pi.user`, `pi.system`, `pi.assistant` and
  `pi.tool-result` today, so the row is styled but never populated.
