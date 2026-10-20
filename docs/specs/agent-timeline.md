# Spec — Agent timeline surface (OpenCode design pass)

**Status:** implemented.
**Scope:** `fleet-ui` only. No backend change, no vendored backend code, no
Durable Object, no wrangler, no Docker/Caddy/CI, no SSO.

## Goal

Turn the Chat tab into a **paseo/cursor-grade agent surface**: every turn
renders as timeline rows, epochs group the rows, each agent carries a
lifecycle chip, and the whole agent surface is restyled with **one** design
system.

Behaviour is a reference only. No paseo or cursor code is forked, vendored or
copied.

## Requirements

### Design system

1. Pick **one** of Linear, Raycast or OpenCode through the `popular-web-designs`
   skill, and take its colour, type, radius and spacing tokens **verbatim**.
   No second palette may be mixed in.
2. Compose with the `shadcn` skill: existing `components/ui` primitives, semantic
   tokens only.
3. The system pass must cover: timeline row styles (turn / tool / result /
   permission), lifecycle chips, epoch headers, the disabled revert control,
   the diff placeholder and the terminal stub.
4. Before/after screenshots: sidebar + agent rail + prompt flow + one epoch
   timeline with tool rows.

### Agent surface

5. Every turn renders as timeline rows: **user turn**, **model turn**, **tool
   call** (`shell` / `read` / `edit` / `write` / `search`), **tool result**,
   **permission request**. Each row type is styled distinctly.
   The Worker returns no `submissionId` per message, so a durable turn is
   attached to an epoch by the **message-id watermark** the browser recorded
   when it sent the prompt: the browser reads the transcript right before the
   POST, and a turn that starts above that watermark was appended by that
   prompt. The newest epoch takes the newest turn. Turns that no epoch can
   point at stay in a labelled *not epoch-linked* group.
6. **Lifecycle chip** per agent: `initializing` / `idle` / `running` / `error` /
   `closed`. Map the current coarse state now (`resident` → idle, prompt in
   flight → running, `model_error` → error). Keep the mapping function isolated
   so a backend lifecycle can replace it later.
7. **Epochs** group rows by `submissionId`; one prompt is one epoch. The epoch
   header shows prompt text, model, timestamp and status.
8. A **revert control** exists per epoch but is **disabled**, with the tooltip
   `needs backend checkpoint`. No fake revert.
9. **Diff affordance**: tool-call rows that touch files show a file path and a
   before/after region, wired to real data when the backend provides it, with
   empty-state text until then. No mocked diffs.
10. **Terminal region**: keep the disabled xterm canvas, labelled
    `terminal — needs containers, not yet`. No fake shell.

### Contracts that must not regress

11. The browser only calls same-origin `/api/*`, which rewrites to
    `/fleet-proxy/*`; `FLEET_URL` is read at request time on the server.
12. Rail order: fleet (`lastActive` descending) > Paperclip > `localStorage`.
13. No streaming; 800-character previews; a buffered POST with a 10-minute
    upstream timeout.
14. Drift, if touched: the `Allow` header must include `HEAD`; the documented
    `limit` is 1–100 with a default of 20.

### Non-goals (hard)

No vendored backend, no database/queue/runtime, no fake backend calls, no fake
diffs, no fake revert, no fake terminal, no direct browser → Worker calls, no
Dockerfile/Caddy/CI changes, no SSO, and no Playwright suite added before
validation.

Every stub is visibly labelled in the UI, and every live claim is backed by a
`curl`.

## Verification

- `npm run check` (typecheck + lint + tests) green.
- `npm run build` green.
- `node scripts/smoke.mjs --prompt --reset` green against `celld dev`.
- `curl` proofs for the `Allow` header, the `limit` clamp and default, the
  rail source, and a prompt that returns a `submissionId`.
- Epoch grouping proven with a real `submissionId` from a smoke run.
- Screenshots attached.
