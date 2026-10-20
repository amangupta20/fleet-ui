# Design system — OpenCode

**Status:** applied across the console (sidebar, agent rail, prompt flow,
timeline, transcript, providers, labs).

**Chosen system:** **OpenCode**
**Token source:** [`.agents/skills/popular-web-designs/templates/opencode.ai.md`](../.agents/skills/popular-web-designs/templates/opencode.ai.md)
(via the `popular-web-designs` skill). Component composition follows the
`shadcn` skill: existing `components/ui` primitives only, semantic tokens only,
no custom markup where a primitive exists.

One palette, one system: the light theme is the OpenCode template's, and the
dark theme is the console skin picked from the three theme demos (see *Picked
theme*). Every colour in the console comes from one of those two lists below —
nothing is mixed in from anywhere else.

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

## Tokens

The light theme is the OpenCode template's palette, verbatim. The dark theme
is the **picked** console skin (see *Picked theme* below): the template's
type, spacing and depth model with a black canvas and two accents.

The CSS variables store the same colours as **HSL channel triples** (`H S% L%`)
because Tailwind's `/opacity` modifiers need a channel triple to work; the
colour is unchanged. Alpha-baked borders keep their own alpha variable for the
same reason.

### Colour — dark theme (`.dark`, the picked skin)

| Role | Token | Value |
|---|---|---|
| Page background | `--background` | `#000000` |
| Elevated surface (card, popover) | `--card` / `--popover` | `#0c0c0c` |
| Primary text | `--foreground` | OpenCode Light `#fdfcfc` |
| Primary fill (button) | `--primary` | OpenCode Light `#fdfcfc` (inverted for dark) |
| Secondary / muted surface | `--secondary` / `--muted` / `--accent` | `#141414` |
| Muted text | `--muted-foreground` | `#8a8a8a` |
| Border / input | `--border` / `--input` + `--border-alpha` | `#262626` |
| Focus ring | `--ring` | Cyan `#22d3ee` |
| Interactive accent | `--accent-brand` | Cyan `#22d3ee` |
| Success / fleet state | `--success` | Success Green `#30d158` |
| Warning / permission | `--warning` | Warning Orange `#ff9f0a` |
| Danger | `--destructive` | Danger Red `#ff3b30` |
| Sidebar surface | `--sidebar` | `#000000` |
| Sidebar selection | `--sidebar-accent` + `--sidebar-accent-alpha` | emerald tint `#0d1a12` |
| Sidebar selection hover | `--sidebar-accent-hover` + `--sidebar-accent-hover-alpha` | emerald tint `#14251a` |

### Colour — light theme (`:root`, the OpenCode template)

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
leading and a console rail cannot afford it. Family, weights and sizes are the
template's; the dark theme's colour and radius are the picked skin.

### Radius

The template allows two radii: `4px` (micro, everything) and `6px` (inputs).
The picked skin widens them into three tokens so a theme can vary them
independently:

| Token | Value | Used for |
|---|---|---|
| `--radius` | `16px` | cards, panels, the epoch header |
| `--radius-control` | `10px` | inputs, buttons, selects |
| `--radius-badge` | `9999px` | badges, chips |

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
| Timeline row — user turn | cyan left rail (the interactive accent), `you` label in mono caps, prompt text in the body font |
| Timeline row — model turn | emerald left rail (fleet state), `Fleet` label, markdown body in a bordered card, status badge (shown when the turn is not `done`) |
| Timeline row — tool call | warning-orange left rail, mono tool name, `shell` / `read` / `edit` / `write` / `search` category tag, `tool call` badge |
| Timeline row — tool result | muted left rail, mono preview in a bordered block, `800ch max` marker |
| Timeline row — permission request | warning-orange bordered panel, `Approve` / `Deny` rendered **disabled** with the reason label |
| Helper row | 12px muted gray (`.helper-text`) — the small notes under a row or an epoch |
| Agent avatar | one neutral tile with the agent's initials — never a palette slot, so a red avatar cannot read as "error" |
| Lifecycle chip | pill badge, 1px border, mono label, badge variant per state (`muted` / `outline` / `brand` / `destructive`) |
| Epoch header | `epoch` label, `submissionId` in the accent colour with a copy button, status badge, prompt text at `16px/700`, one meta line (model · when · latency) and an expandable **Run details** block (ids, timestamps, HTTP status) |
| Disabled revert control | `variant="outline"`, `disabled`, tooltip `needs backend checkpoint` |
| Diff region | dashed 16px-radius region, `before` / `after` columns, empty-state text until the backend ships file data |
| Terminal stub | xterm canvas with `disableStdin`, header label `terminal — needs containers, not yet` |

## Deviations on record

- **The dark theme is the picked skin** (see *Picked theme*): a black canvas,
  cyan as the interactive accent, 16px cards, 10px controls and pill badges
  instead of the template's 4px micro radius. The light theme keeps the
  template's palette.
- **Caption leading** is `1.5` instead of the template's relaxed 2.0
  (footnote leading).
- **Tool output and diffs** use a bordered mono block, not the shadcn
  `CodeBlock` primitive: the repo has no `code-block` component, and adding
  one is a new dependency, which `AGENTS.md` only allows with a spec line.
- **Icons** carry no per-icon size classes and no `data-icon` attribute: the
  primitives size their icons through `[&_svg]:size-4`, so a per-icon class
  would be dead weight.
- **The xterm canvas** repeats four OpenCode colours as literals (see
  *Literals* below).

## Literals

The xterm canvas in the terminal stub needs literal colours, so it repeats
the theme values instead of reading the CSS variables — xterm cannot parse an
HSL channel triple. The dark canvas repeats the picked skin (`#000000`,
`#fdfcfc`, `#30d158`, `rgba(34, 211, 238, 0.25)`), the light canvas the
OpenCode light palette (`#fdfcfc`, `#201d1d`, `#007aff`).

## Picked theme

Three candidate skins were built as parallel routes (`/demo/a`, `/demo/b`,
`/demo/c`) with the same agent, the same `submissionId` and the same surface
behaviour. **Demo c was picked** and its tokens are now the console theme in
`app/globals.css`; the demo routes were deleted with the selection device.

| | Canvas | Accent | Cards | Controls | Badges |
|---|---|---|---|---|---|
| **a** | `#000000` | emerald only | 12px | 10px | pill |
| **b** | `#000000` | emerald + cyan | 12px | 10px | pill |
| **c - picked** | `#000000` | emerald + cyan | 16px | 10px | pill |

The pick record (shots and the reasoning) is in the PR thread; the shots stay
in [`docs/screens/`](screens/README.md).

### What the picked theme changes

- **Canvas** - pure black `#000000` with `#0c0c0c` cards, `#141414` muted
  surfaces and `#262626` borders, instead of OpenCode Dark `#201d1d` /
  `#302c2c` / `#646262`.
- **Two accents** - emerald `#30d158` carries fleet state (success, the `FLEET`
  badge, the selected row), cyan `#22d3ee` carries anything interactive
  (links, the user turn, the active tab, the pane badge). Accent Blue
  `#007aff` is no longer used in the dark theme; the light theme keeps it,
  because the picked cyan is illegible on a light surface.
- **Radius** - 16px cards, 10px controls, pill badges, instead of the 4px
  micro radius. The three tokens (`--radius`, `--radius-control`,
  `--radius-badge`) are what let a skin vary them independently.
- **Helper rows** - the muted notes under a row are 12px gray; the console
  ramp itself stays 14px / 16px.

Everything else is still the OpenCode template: one family, weights
400/500/700, the flat zero-shadow depth model, the 8px spacing grid, and the
same surfaces, type and layout.

## Rules

- No colour outside this document. If a surface needs a new colour, it gets a
  token here first.
- Every stub is labelled in the UI. No fake diffs, no fake revert, no fake
  shell, no mocked backend calls.
- Components compose `components/ui` primitives; no hand-rolled variants of
  Button, Badge, Tooltip, Separator or Skeleton.
