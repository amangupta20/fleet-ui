# Domain docs

Single-context domain documentation for this repo.

## Before exploring

- Read `GLOSSARY.md` at the repo root, if it exists.
- Read the ADRs under `docs/adr/` that touch the area you are about to work in.
- If either does not exist, proceed silently. Do not flag the absence and do not
  suggest creating them upfront; `/domain-modeling` creates them lazily when a term
  or decision is actually resolved.

## Layout

```text
/
├── GLOSSARY.md                 # canonical terms, created when needed
├── docs/
│   ├── adr/                    # NNNN-short-title.md, one decision per file
│   └── agents/                 # this setup: issue tracker + domain rules
├── app/
└── components/
```

## Use the glossary's vocabulary

When naming a domain concept in an issue title, refactor proposal, hypothesis, or
test name, use the term as defined in `GLOSSARY.md`. If the concept is missing, either
you are inventing language the project does not use or there is a real gap worth
noting for `/domain-modeling`.

## Flag ADR conflicts

If your work contradicts an existing ADR, surface it explicitly rather than silently
overriding it: "Contradicts ADR-0007 (<title>), but worth reopening because…".
