# Issue tracker: GitHub

Issues and specs for this repo live in GitHub Issues (`amangupta20/fleet-ui`).
Use the `gh` CLI; run it inside the clone so the repo is inferred from `git remote`.

## Conventions

- **Create**: `gh issue create --title "..." --body-file -` with a heredoc body.
- **Read**: `gh issue view <n> --json number,title,body,labels,state,comments`.
- **List**: `gh issue list --state open --json number,title,labels`.
- **Comment**: `gh issue comment <n> --body "..."`.
- **Label**: `gh issue edit <n> --add-label "..."` / `--remove-label "..."`.
- **Close**: `gh issue close <n> --comment "..."`.
- **Sub-issue**: `gh issue create --parent <n> ...` (gh 2.94+), or add
  `Part of #<n>` at the top of the child body and a task list in the parent.
- **Blocking**: native dependencies —
  `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`
  where the db id comes from `gh api repos/<owner>/<repo>/issues/<n> --jq .id`.
  If unavailable, use `Blocked by: #<n>` at the top of the child body.

A bare `#42` may be an issue or a PR; resolve with `gh pr view 42` and fall back to
`gh issue view 42`.

## What the skills mean

- "Publish to the issue tracker" → create a GitHub issue.
- "Fetch the ticket" → read it as above; state its title before starting work.

## Labels

The build chain uses one label: `ready-for-agent` — "Fully specified, ready for an
AFK agent". `/to-spec` and `/to-tickets` apply it. If it is missing:

```sh
gh label create ready-for-agent --description "Fully specified, ready for an AFK agent" --color 0E8A16
```
