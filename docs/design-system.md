# Design system — OpenCode

**Status:** applied across the console (sidebar, agent rail, prompt flow,
timeline, transcript, providers, labs).

**Chosen system:** **OpenCode**
**Token source:** [`.agents/skills/popular-web-designs/templates/opencode.ai.md`](../.agents/skills/popular-web-designs/templates/opencode.ai.md)
(via the `popular-web-designs` skill). Component composition follows the
`shadcn` skill: existing `components/ui` primitives only, semantic tokens only,
no custom markup where a primitive exists.

No second palette is mixed in. Every colour, radius, font and spacing value in
the console comes from the OpenCode template.

## Why OpenCode

The console is an agent surface, not a marketing page: tool calls, epoch
headers, lifecycle chips, a terminal region. OpenCode is the only candidate
that ships (a) a **complete semantic set** — accent blue, danger red, success
green, warning orange — so lifecycle states and row types never need a colour
that is not in the system, (b) **both light and dark** surfaces, so the
existing theme toggle keeps working without inventing a light palette, and
(c) a **flat, terminal-native** depth model (borders and background shifts,
zero shadows) that matches an xterm-backed console.

Linear and Raycast were rejected: Linear's palette has no danger colour (its
own spec forbids warm chrome), so an `error` lifecycle chip would need a token
that is not in the system; Raycast documents no light mode, so the light theme
would be invented.

## Tokens (verbatim)

Every value below is copied from the template. The CSS variables store the
same colours as **HSL channel triples** (`H S% L%`) because Tailwind's
`/opacity` modifiers need a channel triple to work; the colour is unchanged.
Alpha-baked borders keep their own alpha variable for the same reason.

### Colour — dark theme (`.dark`)

| Role | Token | Template value |
|---|---|---|
| Page background | `--background` | OpenCode Dark `#201d1d` |
| Elevated surface (card, popover, sidebar) | `--card` / `--popover` / `--sidebar` | Dark Surface `#302c2c` |
| Primary text | `--foreground` | OpenCode Light `#fdfcfc` |
| Primary fill (button) | `--primary` | OpenCode Light `#fdfcfc` (inverted for dark) |
| Secondary / muted surface | `--secondary` / `--muted` / `--accent` | Dark Surface `#302c2c` |
| Muted text | `--muted-foreground` | Mid Gray `#9a9898` |
| Border / input | `--border` / `--input` + `--border-alpha` | Border Gray `#646262` |
| Focus ring | `--ring` | Accent Blue `#007aff` |
| Interactive accent | `--accent-brand` | Accent Blue `#007aff` |
| Success | `--success` | Success Green `#30d158` |
| Warning / permission | `--warning` | Warning Orange `#ff9f0a` |
| Danger | `--destructive` | Danger Red `#ff3b30` |

### Colour — light theme (`:root`)

| Role | Token | Template value |
|---|---|---|
| Page background | `--background` | OpenCode Light `#fdfcfc` |
| Card / popover / input surface | `--card` / `--popover` | Input Light `#f8f7f7` |
| Primary text / fill | `--foreground` / `--primary` | OpenCode Dark `#201d1d` |
| Secondary / muted surface | `--secondary` / `--muted` / `--accent` / `--sidebar` | Light Surface `#f1eeee` |
| Muted text | `--muted-foreground` | Text Muted `#6e6e73` |
| Border / input | `--border` / `--input` + `--border-alpha` | Border Warm `rgba(15, 0, 0, 0.12)` (the alpha is the token's own) |
| Focus ring | `--ring` | Accent Blue `#007aff` |
| Accent / success / warning / danger | `--accent-brand` / `--success` / `--warning` / `--destructive` | `#007aff` / `#30d158` / `#ff9f0a` / `#ff3b30` |
| Sidebar surface | `--sidebar` | Light Surface `#f1eeee` |
| Sidebar accent | `--sidebar-accent` + `--sidebar-accent-alpha` | Input Light `#f8f7f7` (light) / OpenCode Light `#fdfcfc` at 6% (dark) |
| Sidebar accent hover | `--sidebar-accent-hover` + `--sidebar-accent-hover-alpha` | Light Surface `#f1eeee` (light) / OpenCode Light `#fdfcfc` at 12% (dark) |

### Typography

The template's rule is "one font, one voice": Berkeley Mono is the only
typeface, with **JetBrains Mono** as the documented CDN substitute. Fleet UI
ships no webfont (the console is offline-first), so both stacks are the
template's mono stack and fall back to the local monospace family:

```
--font-ui: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace
```

Weights follow the template: `400` body, `500` interactive, `700` headings.

The console uses the template's two text sizes, verbatim, through Tailwind's
own scale (`text-base` = 16px, `text-sm` = 14px) so the ramp lives in one
place:

| Template role | Size | Used for |
|---|---|---|
| Body `16px / 400 / 1.5` | `text-base` | model turn text, epoch prompt text, body copy |
| Body Medium `16px / 500 / 1.5` | `text-base` + `font-medium` | buttons, nav, pane titles |
| Heading 2 `16px / 700 / 1.5` | `text-base` + `font-bold` | epoch prompt text, section titles |
| Caption `14px / 400` | `text-sm` | metadata, ids, timestamps, chips, labels |

One adaptation is on record: the caption leading is `1.5` instead of the
template's relaxed `2.0`, because `2.0` is the template's *footnote*
leading and a console rail cannot afford it. Everything else — family,
weights, sizes, colour, radius, spacing — is the template's.

### Radius

The template allows two radii: `4px` (micro, everything) and `6px` (inputs).
The console uses the 4px micro radius everywhere (`--radius: 4px`); no pills,
no large radii. The template's other radii are not in use yet.

### Spacing

8px base grid (`8 / 16 / 24 / 32 / 40 / 48 / 64 / 80 / 96`) with 1/2/4px
micro steps for borders and dense chrome.

### Depth

Flat. The template's depth model is borders and background shifts only, with
zero box-shadows. The theme ships an empty shadow scale, so nothing in the app
renders an elevation shadow.

## Component recipes (agent surface)

| Surface | Recipe |
|---|---|
| Timeline row — user turn | accent-blue left rail, `you` label in mono caps, prompt text in the body font |
| Timeline row — model turn | success-green left rail, `Fleet` label, markdown body in a bordered card, status badge (shown when the turn is not `done`) |
| Timeline row — tool call | warning-orange left rail, mono tool name, `shell` / `read` / `edit` / `write` / `search` category tag, `tool call` badge |
| Timeline row — tool result | muted left rail, mono preview in a bordered block, `800ch max` marker |
| Timeline row — permission request | warning-orange bordered panel, `Approve` / `Deny` rendered **disabled** with the reason label |
| Lifecycle chip | 4px radius, 1px border, mono label, badge variant per state (`muted` / `outline` / `brand` / `destructive`) |
| Epoch header | `epoch` label, `submissionId` in the accent colour, status badge, prompt text at `16px/700`, mono meta row (model · timestamp · latency · request id) |
| Disabled revert control | `variant="outline"`, `disabled`, tooltip `needs backend checkpoint` |
| Diff region | dashed 4px-radius region, `before` / `after` columns, empty-state text until the backend ships file data |
| Terminal stub | xterm canvas with `disableStdin`, header label `terminal — needs containers, not yet` |

## Deviations on record

- **Caption leading** is `text-sm`'s 1.25rem instead of the template's
  relaxed 2.0 (footnote leading).
- **Tool output and diffs** use a bordered mono block, not the shadcn
  `CodeBlock` primitive: the repo has no `code-block` component, and adding
  one is a new dependency, which `AGENTS.md` only allows with a spec line.
- **Icons** carry no per-icon size classes and no `data-icon` attribute: the
  primitives size their icons through `[&_svg]:size-4`, so a per-icon class
  would be dead weight.
- **The xterm canvas** repeats four OpenCode colours as literals (see
  *Literals* below).

## Literals

The xterm canvas in the terminal stub needs literal colours, so it repeats the
OpenCode values (`#201d1d`, `#fdfcfc`, `#30d158`, `#007aff`) instead of
reading the CSS variables — xterm cannot parse an HSL channel triple. They
are the same colours as `--background`, `--foreground`, `--success` and
`--ring`.

## Rules

- No colour outside this document. If a surface needs a new colour, it gets a
  token here first.
- Every stub is labelled in the UI. No fake diffs, no fake revert, no fake
  shell, no mocked backend calls.
- Components compose `components/ui` primitives; no hand-rolled variants of
  Button, Badge, Tooltip, Separator or Skeleton.
