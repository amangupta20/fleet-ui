# Architecture

How the console talks to the fleet: the request path, the proxy route, and
the repository layout.

## Contents

- [Architecture](#architecture)

## Architecture

```text
┌────────────────────────────── Browser ───────────────────────────────┐
│  React 19 + Next.js App Router                                       │
│  ├─ TanStack Query     fleet reads / mutations                      │
│  ├─ Zustand + localStorage  local recents, panes, flags, chat log   │
│  ├─ shadcn/ui + Tailwind    UI system                               │
│  └─ xterm.js           terminal tab stub (flag-gated)               │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ same-origin fetch /api/*
┌───────────────────────────────▼──────────────────────────────────────┐
│  Next.js server (Node runtime)                                       │
│  ├─ rewrite /api/:path* → /fleet-proxy/:path*                       │
│  ├─ fleet-proxy route: optional auth → fetch(`${FLEET_URL}/…`)       │
│  ├─ /api/paperclip/agents → optional PAPERCLIP_* directory           │
│  └─ app shell auth gate + /auth/unlock, /auth/lock                  │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ server-to-server (no CORS)
┌───────────────────────────────▼──────────────────────────────────────┐
│  fleet-base Worker (celld dev or a bucket-backed node)               │
│  /health  /models  /agents  /agent/:name/{prompt,state,messages,…}   │
└──────────────────────────────────────────────────────────────────────┘
```

### Repository layout

```text
app/                    App Router pages, unlock flow, auth, /fleet-proxy, manifest
components/             shell, panes, chat, providers, labs, shadcn/ui primitives
hooks/  lib/  stores/   TanStack Query hooks, API/types/utilities, Zustand stores
public/                 PWA icons, sw.js, self-contained offline.html
scripts/smoke.mjs        live end-to-end API smoke test
tests/                   Vitest unit tests
Dockerfile              multi-stage Next.js standalone image
docker-compose.yml      local Fleet UI next to celld (host networking)
```

There is **no backend source in this repo**. `fleet-base` remains its own Worker project; the only server-side code here is the Next.js proxy/auth layer.

### Why an internal proxy route instead of a literal upstream rewrite?

A direct `rewrites()` destination is frozen into the production build. Routing `/api/*` to `/fleet-proxy/*` and resolving `FLEET_URL` inside the Node route handler gives:

- **Runtime configuration** — one Docker image works against any Worker by setting `FLEET_URL` at container start.
- **Centralized auth** — the same password gate protects API calls, not just HTML pages.
- **No CORS dependency** — the browser never contacts the Worker directly.
- **No cookie leakage** — browser cookies are not forwarded upstream; only `content-type` and `accept` are.

The route supports `GET`, `POST`, `HEAD`, and `OPTIONS`, streams the upstream response back, disables caching, and uses a 10-minute upstream timeout (prompts can be slow). Query strings are forwarded untouched, so `/api/agents?limit=200&prefix=a` reaches `GET /agents?limit=200&prefix=a` on the Worker. Upstream transport failures return a sanitized `502` that never includes `FLEET_URL`.

---
