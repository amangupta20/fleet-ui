# Configuration

Environment variables, the optional Paperclip directory and the shared
password gate.

## Contents

- [Configuration](#configuration)
- [Password gate](#password-gate)

## Configuration

### Environment

| Variable | Required | Default | Runtime? | Purpose |
|---|---|---|---|---|
| `FLEET_URL` | Recommended | `http://127.0.0.1:9876` | Yes | Fleet Worker base URL used by the server-side proxy |
| `PAPERCLIP_URL` | No | unset (hidden) | Yes | Paperclip control-plane base URL for the optional directory; server-only |
| `PAPERCLIP_API_KEY` | No | unset (hidden) | Yes | Bearer token sent only to Paperclip; server-only secret, never committed |
| `FLEET_UI_PASSWORD` | No | unset (gate off) | Yes | Enables the shared-password gate; never committed |
| `PORT` | No | `3000` | Yes | Next server port |
| `HOSTNAME` | No | `0.0.0.0` in Docker | Yes | Bind address in standalone mode |

**`.env.example` contains `FLEET_URL` plus commented Paperclip placeholders.** `FLEET_UI_PASSWORD` and `PAPERCLIP_API_KEY` are secrets and are always supplied through the runtime environment, not a committed example file. Copy the example to `.env.local` for local development (already git-ignored).

`FLEET_URL` must be reachable **from the Fleet UI server**, not from the browser. It can be a private address, a tailnet name, or a container service name.

#### Paperclip (optional)

Set both `PAPERCLIP_URL` and `PAPERCLIP_API_KEY` to enable the Paperclip section of the rail:

```sh
PAPERCLIP_URL='https://paperclip.example.com' \
PAPERCLIP_API_KEY='...' \
FLEET_URL=http://127.0.0.1:9876 \
npm run dev
```

The URL may include the API prefix (`.../api`), a company-scoped path (`.../api/companies/<id>`), or point directly at an agents endpoint; `/agents` is appended when needed and `/api/agents` when the URL has no API path. The server route `GET /api/paperclip/agents` calls it with `Authorization: Bearer $PAPERCLIP_API_KEY`, normalizes the result to `[{name, lastActive?, source:"paperclip"}]`, and returns `[]` when either value is unset. The rail hides an empty/disabled Paperclip section.

The Paperclip key is **never** sent to the fleet Worker; the browser never sees either env value. A Paperclip response is never mixed into fleet authentication, and the fleet proxy does not forward browser cookies or the Paperclip header upstream.

### Provider configuration

Provider keys stay in the Worker's `.dev.vars` / deployment environment. Fleet UI only reads the public `/models` response. At least one of the following must be set in fleet-base for prompts to work:

- own router: `ROUTER_MODEL` and optionally `ROUTER_BASE_URL`, `ROUTER_API_KEY`, `ROUTER_EXTRA_MODELS`
- `OPENCODE_API_KEY` (+ optional `OPENCODE_MODEL`)
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

If none is configured, `/models` reports `default: null` and Fleet UI shows a configuration warning instead of failing silently.

---

## Password gate

Set `FLEET_UI_PASSWORD` on the Fleet UI server:

```sh
FLEET_UI_PASSWORD='a-long-shared-secret' npm run dev
# or
FLEET_UI_PASSWORD='a-long-shared-secret' npm start
```

What it does:

- Unauthenticated page requests redirect to `/unlock`; public exceptions are `/unlock`, `/auth/*`, `/offline.html`, icons, manifest, and static assets.
- All `/api/*` proxy calls return `401` without a valid session.
- Successful login sets an **HttpOnly, SameSite=Lax, HMAC-signed** cookie (seven days). Set `Secure` automatically when the request is HTTPS (directly or via `X-Forwarded-Proto`).
- Changing the password invalidates every existing session.
- The lock button in the sidebar posts to `/auth/lock` and clears the cookie.
- Login attempts are throttled in-memory (10 per 10 minutes per IP). This is per process and resets on restart; put a real rate limiter or access layer in front for hostile networks.

This is a **single shared secret**, not multi-user authentication or authorization. It is best combined with network isolation (private network, VPN, or an authenticating reverse proxy) and TLS.

See [SECURITY.md](../SECURITY.md) for the threat model and reporting process.

---
