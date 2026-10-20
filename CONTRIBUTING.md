# Contributing to fleet-ui

Thanks for taking a look. Fleet UI is a focused project: a polished, self-hosted **console** for a separately-run `fleet-base` Worker. Keeping that boundary clean is the most important contribution rule.

## Scope

**In scope**

- Next.js UI, proxy, auth gate, PWA, accessibility, responsive layout
- Chat/transcript/provider workflows against the documented Worker API
- Tests, docs, deployment ergonomics
- Labs stubs that are clearly inert and call no backend

**Out of scope**

- Vendoring or modifying `fleet-base`, `celld`, Worker code, or Durable Objects
- Adding a database, auth provider, queue, or container runtime to this repo
- Fake backend calls behind future-feature flags
- Direct browser access to the Worker (everything goes through same-origin `/api/*`)

If a feature needs new backend endpoints, open an issue describing the API contract first. The stub policy in `components/labs/` is intentional.

## Local development

Prerequisites: Node.js 22.19+, and a running fleet-base Worker with one provider configured.

```sh
git clone https://github.com/amangupta20/fleet-ui.git
cd fleet-ui
npm install
cp .env.example .env.local

# In another terminal:
cd ../fleet-base && npm install && npm run dev   # http://127.0.0.1:9876

npm run dev                                      # http://localhost:3000
```

Optional password gate:

```sh
FLEET_UI_PASSWORD='local-secret' npm run dev
```

Optional Paperclip directory (both values are server-only):

```sh
PAPERCLIP_URL='https://paperclip.example.com' \
PAPERCLIP_API_KEY='...' \
npm run dev
```

Never commit `.env`, `.env.local`, provider keys, passwords, Paperclip tokens, or copied `.dev.vars` files. The only tracked environment template is `.env.example`, which contains `FLEET_URL` and commented Paperclip placeholders.

## Checks before a PR

```sh
npm run check      # tsc --noEmit + ESLint + Vitest
npm run build      # production/standalone build
```

With the Worker running, exercise the live path:

```sh
FLEET_UI_URL=http://127.0.0.1:3000 \
FLEET_UI_PASSWORD='local-secret' \
node scripts/smoke.mjs --prompt "say hi" --agent smoke-check --reset
```

## Architecture rules

- The browser talks only to same-origin `/api/*`. The Next rewrite and Node proxy resolve `FLEET_URL` at request time so the URL stays server-side.
- `FLEET_URL`, `FLEET_UI_PASSWORD`, `PAPERCLIP_URL`, and `PAPERCLIP_API_KEY` must never be renamed to `NEXT_PUBLIC_*`.
- The fleet proxy and `/api/paperclip/agents` are separate upstreams. Never forward a Paperclip key, header, or cookie to the fleet Worker, and never send fleet values to Paperclip.
- API reads/mutations go through `hooks/use-fleet.ts`; keep query keys centralized in `fleetKeys` and invalidate `serverAgents`/messages/state after prompts.
- The rail uses `mergeAgentRows` (union by name, fleet > paperclip > local) and must tolerate an unreachable Worker by falling back to local recents.
- Persisted client state lives in versioned Zustand stores. If you change a persisted shape, bump the version and write a migration.
- UI primitives follow the shadcn/ui pattern in `components/ui/`. Prefer composition and accessible Radix primitives over one-off markup.
- Strict TypeScript is enforced, including `noUncheckedIndexedAccess`. Avoid `any`; keep API boundary types in `lib/fleet-types.ts`.
- Future feature flags must remain local-only: no `fetch`, no route handlers, and a visible “stub” label.
- Do not add server-side secrets to the client bundle, logs, error responses, or docs.
- Keep error messages user-actionable without disclosing internal network addresses.

## Stub policy

The ten Labs features (`terminal`, `files`, `harness`, `previews`, `mcp`, `skills`, `queues`, `vault`, `nodeOps`, `analytics`) are roadmap surfaces, not implementations. Contributions should improve their honesty and clarity unless a corresponding backend API is designed and documented.

## Commit and PR style

- Conventional-ish commit subjects: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- Keep PRs scoped; include before/after screenshots for visible UI changes.
- Describe manual verification (backend version, browser viewport, password gate/PWA status).
- Update `README.md` and `CHANGELOG.md` for user-visible changes.

## License

By contributing, you agree that your contribution is licensed under the MIT license in [LICENSE](LICENSE).
