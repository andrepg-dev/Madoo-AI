---
date: 2026-06-14
area: backend (email generation prompt)
files:
  - apps/backend/src/generation/generation.service.ts
---

# Stronger structure for generated emails

User reported generated email previews "lack good structure". Root causes in the
generator's system prompt (`STATIC_INSTRUCTION`):

1. **Import contradiction.** The prompt told the model to import from
   `'html-coditor'`, but the sandbox (`react-to-html.service.ts`) only allows
   `react` and `@react-email/components`, and every seed template imports from
   `@react-email/components`. The model only worked by mimicking the few-shot; a
   literal follow of the instruction would fail with "Module not allowed".
2. **No structural guidance.** The prompt was ~90% about variable discipline and
   gave zero explicit layout requirements — structure relied entirely on
   few-shot mimicry, so output was inconsistent.

## Changes (prompt only)

- Fixed the import line to `@react-email/components` and listed the components
  (Html, Head, Preview, Body, Container, Section, Row, Column, Text, Button, Hr,
  Img, Link); kept React imported explicitly.
- Replaced the vague "inline styles or tailwind" line with email-safe styling
  guidance (inline `style` objects; no Tailwind/external CSS/flex/grid/position/
  float).
- Added a required **EMAIL STRUCTURE** spec: Html>Head+Preview>Body>Container
  (maxWidth ~600); a stacked Section order (brand header → hero eyebrow/headline/
  paragraph → primary CTA Button → optional Row/Column content → Hr → footer with
  Unsubscribe); spacing scale + padding; typographic hierarchy; table-based
  columns for Outlook/Gmail + mobile; Img width+alt; and "simple briefs still
  keep the full skeleton".

These system blocks (`STATIC_INSTRUCTION` + few-shot) feed both the generate and
edit flows via `runStream`, so structure applies to edits too.

## Not changed (flagged for the user)

The default model fallback is `claude-sonnet-4-20250514` (older). Bumping to a
current model (e.g. `claude-sonnet-4-6`) would likely improve structure quality,
but it affects cost/billing — left for the user to decide. Overridable via the
`ANTHROPIC_MODEL` env var.

## Verify

`npx tsc --noEmit -p apps/backend/tsconfig.json` → clean. Requires a backend
restart to take effect; then generate a new email and check the structure.
