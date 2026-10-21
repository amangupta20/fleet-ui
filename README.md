# fleet-ui

[![CI](https://github.com/amangupta20/fleet-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/amangupta20/fleet-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-34d399.svg)](LICENSE)
[![Node.js 22.19+](https://img.shields.io/badge/node-%E2%89%A522.19-339933.svg)](.nvmrc)

A self-hosted web console for **[fleet-base](https://github.com/amangupta20/fleet-base)** — a `celld` + [Pi Durable](https://github.com/badlogic/pi-mono) agent fleet.

One tab: the agent rail, an epoch-grouped chat timeline, the durable transcript, and the provider dashboard.

- **Timeline surface** — every turn is a row (user turn, model turn, tool call, tool result, permission request); epochs are keyed by the Worker's `submissionId`; each agent carries a lifecycle chip.
- **One design system** — OpenCode tokens throughout, no second palette; the shipped skin is the one picked from the theme demos.
- **Console only** — the browser calls same-origin `/api/*` through a proxy, so the fleet needs no CORS headers and `FLEET_URL` never reaches the browser.

![Fleet UI — agent timeline](docs/screens/after-chat.png)

## Quickstart

```sh
npm install && cp .env.example .env.local   # FLEET_URL=http://127.0.0.1:9876
npm run dev                                   # http://localhost:3000
```

Point `FLEET_URL` at a running `celld dev` (fleet-base). Easiest deploy: `docker compose up --build` — the UI next to celld on host networking.

> **Scope:** this repository is the **console only**. It does not vendor fleet-base, celld, Worker routes, or Durable Object code. Run the Worker separately and point `FLEET_URL` at it.
>
> **Pinned backend:** fleet-base [`5062749`](https://github.com/amangupta20/fleet-base/commit/5062749) — `Registry` DO + `GET /agents`. Future capabilities are deliberately inert Labs stubs — no fake backend calls.

**Docs:** [Usage](docs/usage.md) · [Configuration](docs/configuration.md) · [Architecture](docs/architecture.md) · [Development](docs/development.md) · [Design system](docs/design-system.md) · [Verification log](docs/verification.md) · [Screenshots](docs/screens/)

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [Credits](docs/development.md#credits) · MIT — see [LICENSE](LICENSE).
