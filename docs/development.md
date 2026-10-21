# Development

Setup, the local scripts and tests, the live smoke test, Docker, deployment
notes, security notes, troubleshooting, the roadmap and the Worker API
assumptions this console targets.

## Contents

- [Setup](#setup)
- [Scripts and tests](#scripts-and-tests)
- [Docker](#docker)
- [Deployment notes](#deployment-notes)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [API assumptions](#api-assumptions)
- [Contributing](#contributing)
- [Credits](#credits)

## Setup

The short path is the quickstart in the [README](../README.md#quickstart). This
is the same flow with the full detail.

### Prerequisites

- **Node.js 22.19+** (see `.nvmrc`)
- A running **fleet-base** Worker with at least one provider configured
- `celld` and `esbuild` on `PATH` for the backend

### 1. Start the fleet Worker

```sh
git clone https://github.com/amangupta20/fleet-base.git
cd fleet-base
npm install
cp .env.example .dev.vars
# Configure one provider path in .dev.vars, then:
npm run dev
# ready at http://127.0.0.1:9876
```

Health check: `curl localhost:9876/health` → `ok`.

### 2. Start Fleet UI

```sh
git clone https://github.com/amangupta20/fleet-ui.git
cd fleet-ui
npm install
cp .env.example .env.local       # FLEET_URL=http://127.0.0.1:9876 by default
npm run dev
# open http://localhost:3000
```

On first load the rail fetches `GET /agents` and shows the fleet's server-side registry; local storage seeds a fallback shortcut named `main` and keeps pane/model/star preferences. Type a prompt (or pick a suggestion) and press **Cmd/Ctrl + Enter**.

Optional password gate for local runs:

```sh
FLEET_UI_PASSWORD='change-me' npm run dev
```

> `FLEET_URL` is read by the Next.js server at request time, not baked into the client. Production builds can change it by restarting with a different value.

---
## Scripts and tests

| Command | Purpose |
|---|---|
| `npm run dev` | Next dev server on `:3000` |
| `npm run build` | Production build (type-checked during build) |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` with strict + `noUncheckedIndexedAccess` |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript rules) |
| `npm test` | Vitest unit tests (34 tests) |
| `npm run check` | typecheck + lint + tests |
| `npm run smoke` | Live API smoke test against a running UI |

### Unit tests

```sh
npm run check
```

Covers agent-name validation/encoding/decoding, the three-source merge selector (duplicate names, precedence, ordering), `GET /agents` normalization plus 502/offline fallback, Paperclip URL/normalization, request IDs, formatting, transcript export, auth token signing/expiry/sanitization, and login throttling. Tests do not require a backend.

### Live verification

Every live claim in this README is checked with a `curl` against a running
`celld dev` — the commands and their output are recorded in
**[docs/verification.md](verification.md)** (Allow header, message-limit
clamp and default, rail source, `submissionId`, live smoke run). Screenshots
live in **[docs/screens/](screens/)**.

### Live smoke test

With Fleet UI running (and `FLEET_UI_PASSWORD` if the gate is on):

```sh
node scripts/smoke.mjs --prompt "say hi" --agent smoke-demo --reset

FLEET_UI_URL=http://127.0.0.1:3001 \
FLEET_UI_PASSWORD='...' \
node scripts/smoke.mjs --prompt "say hi" --reset
```

It exercises the same-origin proxy end-to-end: health, models, `GET /agents?limit=200&prefix=…`, state, prompt, idempotent re-POST with the same ID, messages, and optional reset. With `--prompt` it also verifies the registry recorded two prompt POSTs and runs a **unicode + space agent name** (`--unicode-agent`, default `<agent>-λ agent`) through prompt → messages → exact-name registry lookup. Requires a fleet-base revision with the `Registry` DO (`7eb7e7b` or later).

---

## Docker

The production image is a multi-stage Next.js standalone build. `FLEET_URL` and `FLEET_UI_PASSWORD` are **runtime** environment variables — they are not baked into the image.

```sh
docker build -t fleet-ui .

# Linux: fleet-base listens on 127.0.0.1:9876, so host networking is simplest.
docker run --rm --network host \
  -e FLEET_URL=http://127.0.0.1:9876 \
  -e FLEET_UI_PASSWORD='a-long-shared-secret' \
  fleet-ui
# open http://localhost:3000
```

Or with Compose:

```sh
FLEET_UI_PASSWORD='a-long-shared-secret' docker compose up --build
```

`docker-compose.yml` uses `network_mode: host` deliberately. A bridge-networked container cannot reach a host process bound to `127.0.0.1`. If you prefer bridge networking (or use Docker Desktop), make the Worker reachable from the container, for example:

```sh
docker run --rm -p 3000:3000 --add-host=host.docker.internal:host-gateway \
  -e FLEET_URL=http://host.docker.internal:9876 \
  fleet-ui
```

with celld/the Worker bound to an interface reachable by the container (not only loopback). If the Worker runs in a container on the same Docker network, use its service name instead.

The image runs as a non-root `nextjs` user, exposes `:3000`, and has a healthcheck against the public `/offline.html` page.

---

## Deployment notes

### Self-hosted Node

```sh
npm ci
npm run build
FLEET_URL='http://127.0.0.1:9876' \
FLEET_UI_PASSWORD='...' \
PORT=3000 \
npm start
```

Use a process manager or the provided Docker image, and terminate TLS in front (Caddy, Traefik, nginx). Example Caddy site:

```caddyfile
fleet.example.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
```

Keep the Fleet UI server on the same private network as the Worker when possible. The Worker itself should never be exposed directly to the browser.

### Serverless platforms

Next.js route handlers run on Vercel/other Node hosts, but note:

- The fleet Worker must be reachable from the host (likely public, since the UI server is not on your private network).
- Platform request timeouts may cut off long prompts; the proxy does not stream partial responses.
- PWA service workers require HTTPS.
- Long-lived WebSocket terminal transport (future) will need a different host that supports persistent connections.

Self-hosting next to the fleet is the intended deployment.

### PWA

Serve over HTTPS. The service worker is registered only when `NODE_ENV=production`; `npm run dev` intentionally skips it to avoid stale HMR chunks.

---

## Security notes

- **No secrets in git.** `.env*` is ignored except `.env.example`; `.backend/` (local test copy), `.next/`, `.local-check/`, caches, and coverage are ignored. The example file contains `FLEET_URL` and commented Paperclip placeholders only.
- **Server-only Worker URL.** `FLEET_URL` is never emitted to the client bundle; the browser can only call same-origin `/api/*`.
- **Server-only Paperclip key.** `PAPERCLIP_URL` and `PAPERCLIP_API_KEY` are read only by `app/api/paperclip/agents/route.ts`. The key is sent only to Paperclip as a Bearer token; it is never forwarded to `FLEET_URL`, included in `/api/*` fleet requests, exposed in `/api/paperclip/agents` responses, or written to logs. The two upstreams are independent.
- **Auth is optional and shared.** `FLEET_UI_PASSWORD` is a single shared secret with in-memory throttling. It is not SSO, per-user authorization, or an audit system. Use network isolation for stronger guarantees.
- **Session cookie.** HttpOnly, SameSite=Lax, Path=/, seven-day expiry, HMAC-SHA256 over an expiry timestamp with a key derived from the password. Changing the password logs everyone out. `Secure` is set when HTTPS is detected directly or via `X-Forwarded-Proto`.
- **Proxy does not forward browser cookies upstream.** Only `content-type` and `accept` are forwarded. The Worker API is unauthenticated by design in fleet-base. `/api/paperclip/agents` enforces the same password gate but forwards neither browser cookies nor fleet headers.
- **localStorage is a fallback directory.** It caches recents, rail labels/stars, pane layout, and chat logs; the fleet index is server-authoritative. If the server is unreachable, the UI degrades to these recents with no blocking error.
- **Markdown rendering is escaped** by `react-markdown`; this UI does not render raw HTML or use `dangerouslySetInnerHTML`. Links open with `rel="noreferrer noopener"`.
- **localStorage is readable by any script on the origin.** Prompts and full responses are persisted there for the session log. Use **Settings → Clear chat history** / **Reset local workspace** on shared machines.
- **Response headers** include `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- **No CSP is configured.** A strict CSP is recommended for public deployments; Next.js dev overlays and inline scripts make this non-trivial to add generically.
- **The login throttle is per process**, so horizontally scaled deployments need a shared limiter or an upstream auth proxy.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| “Worker offline” everywhere | `FLEET_URL` wrong, `celld dev` not running, or the server cannot reach the Worker. Check `curl $FLEET_URL/health` from the Fleet UI host. |
| `401 Unauthorized` from `/api/*` | `FLEET_UI_PASSWORD` is set and the session cookie is missing/expired. Reload → `/unlock`, or restart without the variable to disable the gate. |
| `/unlock` redirects to `/` | The gate is off (empty/missing `FLEET_UI_PASSWORD`). |
| Models list empty / no provider | Configure one of `ROUTER_MODEL` + `ROUTER_BASE_URL`, `OPENCODE_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY` in fleet-base, then restart celld. |
| Prompt fails with 502 | Fleet UI cannot reach the Worker from the server process. In Docker, see the host-networking note above. |
| Fleet section missing | `FLEET_URL` is unreachable or the backend predates `GET /agents`; the rail falls back to local recents. Check `curl $FLEET_URL/agents?limit=1` from the Fleet UI host. |
| Paperclip section missing | Set **both** `PAPERCLIP_URL` and `PAPERCLIP_API_KEY` and restart the server. Unset config is intentionally silent; check the server log for a sanitized `[paperclip]` error if both are set. |
| Prompt takes a long time / 504 | Model latency. The proxy allows 10 minutes; the host/reverse proxy may impose a shorter timeout. |
| PWA not installable / no service worker | Must be a production build served over HTTPS (localhost is exempt); service worker registration is intentionally disabled in dev. |
| Stale UI after deployment | Hard reload; check the service worker update prompt. Bump the `VERSION` in `public/sw.js` when changing shell caching. |
| Agent is “unreachable” but prompts work | `/state` is a coarse reachability indicator; prompts can still succeed. |
| Reused ID shows old run | Expected idempotency when agent + prompt + request ID match. Use **Retry** or a new ID to start a new run. |
| Local state looks wrong | **Settings → Reset local workspace** clears agents, panes, flags, and chat logs. Server state is untouched. |
| Port 3000 in use | `PORT=3001 npm start` or `npm run dev -- --port 3001`; update the URL used for smoke tests. |

---

## Roadmap

### Shipped in v1

- Agent rail with server `GET /agents`, optional Paperclip directory, local fallback recents, search, lifecycle chips, and origin badges
- Chat as an agent timeline: epoch-grouped rows (user, model, tool call, tool result, permission), request IDs, model override, latency, status/reason, IDs, copy/export/retry, disabled revert stub
- One design system (OpenCode tokens) across the agent surface
- Durable transcript viewer with limits and export
- Provider dashboard with catalog, live router discovery, and search
- 1–4 pane workspace, per-pane composers, mobile pane switcher
- Light/dark/system themes, responsive phone layout, PWA shell and offline page
- Optional password gate, lock, throttling, secure headers
- Labs stubs for ten future capabilities
- Docker, Compose, runtime env, MIT license, tests and smoke script

### Next (needs backend work)

- Streaming prompt responses (SSE/WebSocket) and a stop button
- Full message content instead of 800-character previews
- Create/delete/rename agent metadata server-side (today names come from the Registry; rail labels/stars remain local)
- Prompt history search, pinning, and multi-select export
- Background run queue with persisted in-flight state across reloads
- Server-side latency/token analytics instead of browser-only measurements
- Terminal PTY transport behind the existing flag (the canvas is a labelled stub today: *terminal — needs containers, not yet*)
- Files/diff API and preview routing (the diff region is wired and empty until then)
- Checkpoint/revert endpoint, so the epoch revert control can do more than label itself
- `submissionId` per transcript message, so durable rows can join their epoch
- MCP/skill registries
- Vault-backed per-agent secrets
- Node/lease operations from the UI
- Multi-user auth, roles, audit log, CSP/hardening pass
- Playwright browser test suite and CI against a `celld dev` fixture

### Explicit non-goals for v1

The UI does not add a database, auth provider, queue, or container runtime. Fleet-base remains the source of truth; Fleet UI is a console.

---

## API assumptions

Fleet UI targets the fleet-base Worker API:

| Endpoint | Used for |
|---|---|
| `GET /health` | Worker status chip / connectivity |
| `GET /models` | Default, configured flags, catalog, router live ids |
| `GET /agents?limit=&prefix=` | Fleet rail directory: `{agents:[{name,lastActive,prompts}], count}`; `limit` 1–1000 (default 100), prefix filters decoded names |
| `POST /agent/:name/prompt` | Prompt with `{prompt, requestId, model?}` |
| `GET /agent/:name/state` | Rail/pane reachability |
| `GET /agent/:name/messages?limit=` | Durable transcript previews. The server clamps `limit` to **1–100** and defaults to **20** when it is omitted |
| `POST /agent/:name/reset` | Fresh agent context |

The browser only ever requests `/api/*`, which Next rewrites to the same-origin `/fleet-proxy/*` route; `FLEET_URL` is read at request time on the server and never reaches the client. That route answers `GET`, `POST`, `HEAD` and `OPTIONS`, and its `OPTIONS` response advertises `Allow: GET, POST, HEAD, OPTIONS`. Unknown statuses/kinds are rendered defensively rather than assumed. The request ID field accepts letters, numbers, and `. _ : / = -` up to 200 characters.

Fleet UI also serves a non-fleet route: `GET /api/paperclip/agents` (same password gate, server-only `PAPERCLIP_*`) returns `[{name, lastActive?, source:"paperclip"}]`. It is optional and hidden when unconfigured; it is not part of the fleet-base contract.

---

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](../CONTRIBUTING.md) first — it covers the UI-only scope, local backend setup, checks, and the stub policy. Security reports should follow [SECURITY.md](../SECURITY.md), not a public issue.

---

## Credits

Behavior-only references; no code was forked from these projects:

- [hypernewbie/phi](https://github.com/hypernewbie/phi) — tabs, presets, detach-style pane ergonomics
- [getpaseo/paseo — docs/ARCHITECTURE.md](https://github.com/getpaseo/paseo/blob/main/docs/ARCHITECTURE.md) — lifecycle, timeline epochs, provider UX
- [cloudflare/sandbox-sdk — terminal-workspace](https://github.com/cloudflare/sandbox-sdk/tree/main/examples/terminal-workspace) — terminal workspace layout inspiration
- [cloudflare/agents-starter](https://github.com/cloudflare/agents-starter) — app ergonomics reference
- [fleet-base](https://github.com/amangupta20/fleet-base) — the Worker API this console targets
- [shadcn/ui](https://ui.shadcn.com/) — component patterns adapted under the MIT license

---
