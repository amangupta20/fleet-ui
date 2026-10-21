# Usage

Everything the console does day to day: the features, the rail, the agent
timeline, request IDs, model overrides, export, the provider dashboard, the
multi-pane workspace, the Labs stubs and the PWA shell.

## Contents

- [Features](#features)
- [Using the console](#using-the-console)
- [Providers dashboard](#providers-dashboard)
- [Multi-pane workspace](#multi-pane-workspace)
- [Feature flags and Labs](#feature-flags-and-labs)
- [PWA, themes, and phones](#pwa-themes-and-phones)

## Features

| Area | v1 behavior |
|---|---|
| **Agent rail** | Server `GET /agents` + optional Paperclip directory + local recents, grouped **Fleet / Paperclip / Local** with origin badges; activity + prompt counts, search, add/rename/star/remove local shortcuts, reachability dots |
| **Chat** | Prompt composer on an **agent timeline**: every turn renders as rows (user turn, model turn, tool call, tool result, permission request). Epochs are keyed by the Worker's `submissionId`; each epoch header carries prompt, model, timestamp, status and a **disabled** revert control |
| **Lifecycle** | Per-agent chip — `initializing` / `idle` / `running` / `error` / `closed` — mapped from the coarse backend state in one isolated function (`lib/lifecycle.ts`) |
| **Idempotency** | Auto-generated request IDs per send, manual IDs, reuse-last, same-ID retry; copy every ID |
| **Durable transcript** | Tail `GET /agent/:name/messages` with limit selector (server clamps to 1–100, default 20 when omitted), kind/id/preview rendering, refresh, JSON/text export |
| **Reset** | Confirmed `POST /agent/:name/reset`; clears server context and the browser run log for that agent |
| **Providers** | `/models` default, configured flags, catalog search/filter, context + output limits, router base URL and live ids, unpinned-id warning |
| **Workspace** | 1–4 pane layouts, persisted pane assignments, independent composers, mobile pane switcher |
| **Theming** | Light / dark / system via `next-themes`; responsive phone layout |
| **PWA** | Manifest, icons, production service worker, offline fallback page, installable shell |
| **Password gate** | Optional shared password via runtime env, HMAC-signed HttpOnly cookie, login throttle, lock button |
| **Keyboard** | `Cmd/Ctrl + Enter` sends; `Shift + Enter` inserts a newline |
| **Labs** | Ten future-feature stubs behind local flags: terminal, files/diff, harness picker, preview URLs, MCP, skills, queues/runs, vault, node ops, analytics |
| **Design system** | One system, applied end to end: **OpenCode** tokens (colour, type, radius, spacing) with no second palette mixed in — see [docs/design-system.md](design-system.md) |

No provider keys, passwords, or fleet URLs are compiled into the client bundle.

---

## Using the console

### Agents

The rail is a **merge selector**, not a browser-owned list:

- **Fleet** — `GET /agents?limit=200` through the same-origin proxy. The Registry DO returns names, `lastActive`, and `prompts`; rows show relative activity and prompt count, sorted most-recent first.
- **Paperclip** — optional server-only directory (above). Its section is hidden when `PAPERCLIP_URL`/`PAPERCLIP_API_KEY` are unset or the list is empty.
- **Local** — `localStorage` recents and local-only shortcuts. This is now a **fallback**, not the source of truth. If the Worker is offline or the proxy returns a sanitized `502`, the rail still renders local recents.
- Names are unioned across sources: **fleet wins over Paperclip, which wins over local**. One badge per row shows the winning origin; local metadata (model override, rail label, star) is retained without changing the row's source.
- Clicking any row uses the existing chat flow: `GET /agent/:name/messages` + `POST /agent/:name/prompt`, with `encodeURIComponent` applied to the name on every request. Displayed names are decoded.
- Adding an agent creates a local shortcut, not a server record. **Rename** changes only the rail label and **star** is browser-local; neither changes the Durable Object name.
- A Durable Object is created/activated lazily on the first `prompt` (or first `/messages` read).
- Any valid `:name` works. Names are trimmed, capped at 64 characters, and cannot contain `/ \ ? #` or control characters. Spaces and unicode are encoded safely.
- The **64-character cap is an intentional UI rule**, not a backend contract. Fleet-base allows names up to 128 characters, so names 65–128 characters long can be created with `curl` and will appear in the fleet directory, but the UI will not create them (the add-agent form rejects them). The lower limit keeps rail and header layouts readable.
- Each rail row carries a **lifecycle chip**. `GET /agent/:name/state` is deliberately coarse, so the console derives the state from what it can prove: `resident` → **idle**, a prompt in flight → **running**, a `model_error` run → **error**, a pending probe → **initializing**, an unreachable agent → **closed**. The mapping lives alone in [`lib/lifecycle.ts`](../lib/lifecycle.ts) so a backend that reports real lifecycle states can replace it without touching a component.
- Removing a shortcut does not delete the Durable Object, transcript, or model pin. Fleet/Paperclip rows reappear from their server list; local-only rows disappear.

### Timeline, epochs and the durable transcript

The **Chat** tab is an **agent timeline**, not a chat bubble list. Every turn renders as timeline rows, and each row type has its own rail colour, glyph and type treatment:

| Row | Source |
|---|---|
| **user turn** | the prompt that opened the epoch |
| **model turn** | the Worker's answer (markdown), or the failure |
| **tool call** | a tool named in the Worker preview (`tool:<name>` markers), tagged `shell` / `read` / `edit` / `write` / `search` |
| **tool result** | the Worker's `pi.tool-result` preview, capped at 800 characters |
| **permission request** | a pending approval, rendered with **disabled** approve/deny controls |

**Epochs** group rows by the `submissionId` the Worker returned for a prompt — one prompt is one epoch. The epoch header shows the prompt text, the model, the timestamp, the status, and a **disabled** `Revert` control with the tooltip `needs backend checkpoint`. The Worker has no checkpoint endpoint, so the control is a labelled stub: it never claims to have reverted anything.

Two proven sources feed the timeline:

- The **browser run log** (`localStorage`, `fleet-ui.chat.v1`) carries the real `submissionId`, the prompt and the answer. These are the epochs.
- The **durable transcript** (`GET /agent/:name/messages?limit=…`) carries the tool activity, but the Worker returns no `submissionId` per message. To link a durable turn to the epoch that caused it, the browser records the **highest durable message id** it has seen when it sends a prompt; a turn that starts above that watermark was appended by that prompt and is shown inside its epoch, labelled with the rule that linked it. Turns that predate every watermark stay in a separate **durable activity** group, labelled *not epoch-linked*, instead of being attached to an epoch they might not belong to. When the backend starts returning a `submissionId` per message, the grouping picks it up with no UI change.

The **Transcript** tab still shows the raw server entries (`{id, kind, preview}`) with export. Both views are labelled accordingly: this UI cannot reconstruct full messages it never received.

**No streaming.** A prompt POST is buffered end to end (the proxy allows a 10-minute upstream timeout) and the answer arrives in one piece. The composer footer states this: `no streaming · buffered POST · 10 min`.

**Reset** invokes `POST /agent/:name/reset`, clears the server's active context, and clears the browser log for that agent.

### Request IDs and idempotency

- With **Auto-generate** on (default), each send gets a fresh `req_<uuid>`.
- Use the **ID** control under the composer to edit, copy, or regenerate an ID; toggle auto-generation; or **reuse last**.
- Reusing a request ID with the same prompt returns the same durable operation. The response card shows the same `submissionId`/`operationId`.
- **Reuse ID** on a run restores the prompt, ID, and turns auto-generation off for an exact idempotency test.
- **Retry** restores the prompt with a new ID.
- A `requestId` is sent as `requestId` in the POST body (the Worker also accepts it as `operationId`).

### Model overrides

The model picker in the composer sends `model` as `provider/id` (or omits it to use the fleet default). The Worker pins the agent's session to that model; the override is also stored per agent in this browser. Unconfigured providers are visible but disabled. If the UI is blocked by a stale/unconfigured pin, clear the override or use the fleet default.

### Latency, status, and reason

- **Latency** is the client-measured round trip around the proxied POST, including model time; it is not a server-side metric.
- **Status** is displayed as `done`, `unanswered`, or the raw server value.
- **Reason** is shown verbatim when the Worker returns one. It is the first field to inspect for an `unanswered` run.
- **Run details** lists `requestId`, `submissionId`/`operationId`, latency, creation time, and HTTP status (for request failures).
- Errors preserve the prompt so you can retry without retyping.

### Copy and export

- Copy one response, copy request/operation IDs, copy the whole session log, or export Markdown/JSON.
- The Transcript tab exports the server's preview entries as `.txt`/`.json`.
- Browser history is capped (60 runs per agent, 80k characters per response) to keep localStorage bounded.

---

## Providers dashboard

`/providers` renders `GET /models`:

- Fleet default model and resolved provider.
- Per-provider configured flags (`router`, `opencode-go`, `openai`, `google`).
- Full catalog with context window, max output, readiness, and one-click copy of `provider/id`.
- Router base URL and live ids; if the router exposes ids not pre-registered in the catalog, a warning explains that they need `ROUTER_EXTRA_MODELS` before they can be selected per request.
- Search, provider filters, refresh, and error guidance when the Worker is unreachable.

This page never receives provider API keys.

---

## Multi-pane workspace

- Layout buttons switch between **1, 2, 3, and 4 panes** (3 columns or a 2×2 grid on desktop).
- Assign agents by selecting one in the rail or using an empty pane's picker; each pane has its own header, tabs, composer, request ID, and model selector.
- The same agent may appear in multiple panes (manual assignment); they share the same live run store but have independent composers.
- Layout, pane assignments, and the active pane persist in `localStorage`.
- On phones, only the active pane is shown, with a pane switcher under the toolbar. Navigation collapses into a sheet.
- Inactive panes stay mounted, so an in-flight prompt that finishes while you are in another tab is not lost.

---

## Feature flags and Labs

Open **Labs** from the sidebar. Every flag is off by default, persisted locally, and renders only inert UI. **No future-feature flag triggers a backend request.**

| Flag | Stub surface | What exists | What it would need |
|---|---|---|---|
| `terminal` | Pane tab + Labs | Working xterm.js canvas, local banner, input disabled, no transport | PTY/WebSocket transport, shell sandbox |
| `files` | Pane tab + Labs | Empty diff region — no file transport, so nothing is drawn | Node/filesystem API, diff endpoint |
| `harness` | Composer badge + Labs | Disabled “Pi Durable (default)” picker | Multiple harnesses and a selector API |
| `previews` | Labs | Inert URL preview card | Signed preview router |
| `mcp` | Labs | Fake disconnected servers | MCP client + tool discovery |
| `skills` | Labs | Locked skill chips | Skill registry/loading |
| `queues` | Labs | Static scheduled rows | Queue/scheduler endpoints |
| `vault` | Labs | Masked key rows | Encrypted secret store + scoped access |
| `nodeOps` | Labs | Simulated node/lease cards | celld node admin API |
| `analytics` | Labs | Sample bar shape | Durable run metrics and rollups |

Turning on `terminal` or `files` also adds that tab to every agent pane. Turning the flag off falls back to Chat. See **Settings → Reset local workspace** or **Labs → Reset flags** to clear local state.

---

## PWA, themes, and phones

- **Manifest:** served from `/manifest.webmanifest`; icons live in `public/icons/` (192/512/maskable + apple touch).
- **Service worker:** `public/sw.js`, registered **only in production builds**. It caches the offline page and same-origin static assets, uses network-first navigation, and never intercepts `/api/`, `/fleet-proxy/`, `/auth/`, or `/unlock`.
- **Offline:** navigations fall back to `/offline.html`; prompts still require a live Worker.
- **Install:** serve over HTTPS (localhost is exempt), then use “Install app” in the browser. The manifest provides `standalone` display and workspace/providers shortcuts.
- **Themes:** light/dark/system via `next-themes`; no flash-prevention script beyond next-themes. The `<html>` class is set by the provider.
- **Phones:** 390 px layouts are supported; the rail is a sheet, panes switch individually, and the composer remains pinned above the safe area.

Verify PWA behavior with a production build:

```sh
npm run build
FLEET_URL=http://127.0.0.1:9876 npm start
# DevTools → Application → Service Workers / Manifest
```

---
