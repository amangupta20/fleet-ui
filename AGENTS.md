# fleet-ui — agent guide

Next.js 15 / React 19 console for fleet-base. The browser talks only to the
same-origin `/api/*` proxy; the Worker URL never reaches the client. Keep feature
flags and Labs stubs honest: no fake backend behavior.

`workflow-router` is the mandatory entry point. It classifies every task before any
edit; it is model-invocable only (there is no `/workflow-router` command).

## Commands

- `npm run dev` — Next dev server.
- `npm run check` — typecheck + lint + tests. Run before every commit.
- `npm run test` — Vitest; `npm run test:watch` while iterating.
- `npm run smoke` — end-to-end smoke against a running backend.
- `npm run build` — production build; run when route/boundary/bundle shape changes.

## Routing

- **Vague** — no spec/issue, fuzzy verbs, or >2 modules with no plan →
  `/grill-with-docs`. No code, tickets, or edits until the user approves the
  direction.
- **Clear change** — concrete surface, no spec/issue → `/to-spec`, then
  `/implement`.
- **After implement** — apply the review gate.

## Major change

A change is major if it touches `app/`, `components/`, `lib/`, adds a
route/endpoint/tool, adds a dependency, changes schema/storage/migrations, or
exceeds 50 changed non-docs lines. Everything else is minor.

## Review gate

- **Major:** run `/code-review` (R1 Standards + R2 Spec, parallel subagents), then
  `/scope-cop-review` (R3) on the same fixed point, diff, and spec.
- **Minor:** run R3 only.
- R1 or R2 **FAIL blocks merge**; fix and re-run all three.
- R3 flags are **removed or justified in the PR body** with a spec line. Default:
  delete.
- Paste all three reports as **separate PR comments**, one per axis. The PR body
  carries no review verdicts.
- No path may skip its gate. Finishing implement on a major change without R1+R2+R3
  is a workflow violation: say so and do not call the work done.

## Standing rules

- **Spec-first:** one short spec per feature before code. Spec-first work cuts error
  rates by up to 50%; no spec, no feature.
- **Small diffs:** AI-authored defects grow with diff size. One feature per PR; split
  large or mixed diffs before review, not after.
- The browser never sees `FLEET_URL`; keep all backend access behind `/api/*`.
- Reuse `components/ui` primitives and existing tokens; no raw hex colors or one-off
  spacing scales in new UI.
- Labs features stay visibly inert until the backend exists; never fake a call.
- No new dependency without a spec line that needs it; check bundle cost first.
- Do not edit `~/.agents/skills` or `.agents/skills` during a feature change.

## PR body

- **Title:** a conventional prefix (`feat:`, `fix:`, `docs:`) and a plain
  description. No internal slang — no `deslop`, no `pass`, no codenames.
- **Body:** under 40 lines, four sections — `Summary` (three bullets),
  `Changes` (new / removed / rewritten / docs, one line each),
  `Test plan` (check + build + smoke), `Notes`. Link the docs
  (`docs/verification.md`, `docs/screens/`); do not paste them.
- **Reviews:** R1 / R2 / R3 go as separate PR comments, never in the body.
- **Code fences** must render: close every ```shell block, and never leave an
  `undefined` prefix on a fence or its language tag.
- **Screenshots:** before/after tables only, captured on the same agent and the
  same `submissionId`. Delete stale shots instead of carrying them.

## Agent skills

### Issue tracker

GitHub Issues via `gh`; label `ready-for-agent`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/`, created lazily. See
`docs/agents/domain.md`.

### Installed here

Workflow: `grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `tdd`,
`diagnosing-bugs`, `code-review`, `scope-cop-review`, `workflow-router`.
Stack: `vercel-react-best-practices`, `shadcn`, `frontend-design`,
`popular-web-designs`.
The matt shims call `grilling`, `domain-modeling`, and `codebase-design`, installed
at user level (`~/.agents/skills`).
