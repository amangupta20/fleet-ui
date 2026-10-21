# Changelog

All notable changes to Fleet UI are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Chat is now an **agent timeline**: every turn renders as rows (user turn, model turn, tool call, tool result, permission request), each with its own rail colour, glyph and type treatment
- **Epochs** group rows by the Worker's `submissionId` — one prompt is one epoch — with a header that shows prompt text, model, timestamp and status, plus per-epoch copy/export/retry/reuse-id actions
- Per-agent **lifecycle chip** (`initializing` / `idle` / `running` / `error` / `closed`), derived from the coarse backend state in one isolated function (`lib/lifecycle.ts`) so a backend lifecycle can replace it
- **Design system**: OpenCode tokens (type, spacing, flat depth) with the picked console skin for colour and radius — one family, 16px cards, 10px controls, pill badges, no second palette; documented in `docs/design-system.md`
- Before/after screenshots in `docs/screens/` and a feature spec in `docs/specs/agent-timeline.md`
- Fleet rail now reads `GET /agents` through the proxy (with `limit`/`prefix` forwarding and sanitized 502 fallback) and groups rows into Fleet / Paperclip / Local
- Optional Paperclip directory via server-only `PAPERCLIP_URL` + `PAPERCLIP_API_KEY` and `GET /api/paperclip/agents`; hidden when unconfigured
- `mergeAgentRows` union selector: fleet > paperclip > local precedence, activity ordering, origin badges, relative activity/prompt counts
- Browser-local rail rename and star affordances; local shortcuts are now a fallback, not the source of truth
- Merge-selector, Paperclip normalization, and unicode/space-name coverage in Vitest; smoke test now checks `/agents` after two prompts and an encoded unicode agent end-to-end
- README pinned to verified fleet-base `7eb7e7b` and documents the new env contract

### Changed

- **Console theme**: the dark theme is now the skin picked from three theme
  demos — a pure black canvas, emerald for fleet state (success, the `FLEET`
  badge, the selected row) and cyan for anything interactive (links, the user
  turn, the active tab), 16px cards, 10px controls, pill badges. Type,
  spacing and the flat zero-shadow depth model stay on the OpenCode template.
- Epoch metadata collapses to one line with an expandable **Run details**
  block; the watermark rule moved into a tooltip; helper rows are 12px gray.
- The Files & diffs surface no longer draws a sample file tree or a sample diff; it renders the wired-but-empty diff region and says what the Worker does not return
- The agent avatar is one neutral tile with the agent's initials: it no longer picks a palette slot by hashing the name, so a red avatar can no longer read as "error" — colour in the rail is reserved for state and source
- The terminal stub keeps the disabled xterm canvas but drops the fake shell prompt, and is labelled `terminal — needs containers, not yet`

### Removed

- The chat bubble run cards (`components/workspace/run-card.tsx`) — their content is now epoch headers and timeline rows

### Planned

- Streaming prompt responses and run cancellation
- Full transcript content from the Worker API
- Playwright suite in CI
- Terminal, files, MCP, skills, queues, vault, node-ops, and analytics backends

## [0.1.0] — 2026-10-20

### Added

- Next.js 15 App Router console with strict TypeScript, Tailwind, shadcn/ui, TanStack Query, and Zustand
- Same-origin `/api/*` proxy with runtime `FLEET_URL`, server-only URL handling, and sanitized upstream errors
- Agent rail persisted in `localStorage`; any Durable Object `:name`, validation, search, reachability, removal
- Chat workspace with markdown answers, model override (`provider/id`), auto/manual request IDs, reuse-last, retry, copy/export, reset, status/reason, and full run metadata
- Durable transcript viewer with limit selector, refresh, and text/JSON export
- Providers dashboard with default, configured flags, catalog search/filter, context/output limits, router live discovery, and unpinned-id guidance
- 1–4 pane layouts with persisted assignments and a mobile pane switcher
- Optional password gate with HMAC-signed HttpOnly cookie, per-process login throttle, lock button, and API protection
- PWA manifest, icons, production service worker, and a self-contained offline page
- Light/dark/system themes and phone layouts
- Ten local-only Labs stubs: terminal (xterm.js), files/diff, harness picker, preview URLs, MCP, skills, queues/runs, vault, node operations, analytics
- Dockerfile, Compose, standalone build, CI workflow, unit tests, and live smoke script
- Documentation for configuration, deployment, security, and roadmap

[Unreleased]: https://github.com/amangupta20/fleet-ui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/amangupta20/fleet-ui/releases/tag/v0.1.0
