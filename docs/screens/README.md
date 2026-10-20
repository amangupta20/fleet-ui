# Screenshots

Every shot is captured against a running fleet-base (`celld dev`) through the
same-origin proxy, with the same browser state seeded so the agent, the pane
and the `submissionId` are identical between shots.

## The change (v0.1 chat bubbles → agent timeline)

Same backend, same agent (`ui-smoke-tool`), same real `submissionId`
(`smoke_1792500534983_5cq3nq`).

| Before | After |
|---|---|
| ![Before — chat bubbles](before-chat.png) | ![After — epoch timeline](after-chat.png) |

The agent rail before and after (reachability dot → lifecycle chip, sans → mono):

| Before — rail | After — rail |
|---|---|
| ![Before — rail](before-rail.png) | ![After — rail](after-rail.png) |

| After — epoch timeline with tool rows | After — disabled revert, labelled stub |
|---|---|---|
| ![After — tool rows](after-tool-rows.png) | ![After — revert tooltip](after-revert-tooltip.png) |

| After — lifecycle chip `running` | After — terminal stub |
|---|---|---|
| ![After — running lifecycle](after-running-lifecycle.png) | ![After — terminal](after-terminal.png) |

The diff region ships wired but empty — it renders real before/after content as
soon as the backend provides a patch, and says so until then:

![After — diff placeholder](after-diff-placeholder.png)

## Theme demos (the pick)

Three candidate skins were built as parallel routes (`/demo/a`, `/demo/b`,
`/demo/c`) with the same agent, the same `submissionId` and the same surface
behaviour. **Demo c was picked**; its tokens are the console theme now, and the
demo routes were deleted with the selection device — so the shots of the
candidates are not kept here. The shipped skin is what the "after" shots above
show; the pick and the deviations it carries are recorded in
[`../design-system.md`](../design-system.md), and the reasoning is in the pull
request thread.
