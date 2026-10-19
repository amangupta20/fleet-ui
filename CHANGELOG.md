# Changelog

All notable changes to Fleet UI are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
