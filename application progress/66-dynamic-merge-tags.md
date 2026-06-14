---
date: 2026-06-14
area: email variables (dynamic merge tags)
files:
  - packages/shared/src/emails.ts
  - apps/backend/src/generation/generation.service.ts
  - apps/backend/src/emails/emails.service.ts
  - apps/client/components/project/preview/VariablesPanel.tsx
  - apps/client/app/email-template-project/page.tsx
---

# Dynamic variables render as highlighted {{merge tags}}

New rule: **dynamic** variables are personalization placeholders (filled per
recipient outside Madoo), **static** variables are fixed values.

## Backend — render dynamic as `{{name}}`

- `@madoo/shared` `buildRenderVariables(schema)`: static → its `default`,
  dynamic → `{{name}}`.
- Used at both compile sites: `generation.service` (initial generate + edit,
  previously compiled with `{}`) and `emails.service.updateVariantVariableSchema`
  (previously used every `default`). So `compiledHtml` now carries `{{name}}`
  literals for dynamic fields — correct for ESP merge on export too.

## Client

- **Panel:** the value `Input` shows only for `static` variables. Dynamic ones
  show a read-only accent-colored `{{name}}` chip instead (no editable value —
  it's a placeholder).
- **Preview highlight:** `highlightMergeTags(html)` wraps `{{…}}` occurrences in
  blue spans, walking only body **text nodes** (never attributes), and feeds the
  result to the inline `EmailPreviewSidebar` iframe. Preview-only — the exported
  HTML / overlay / testing tabs keep the plain `{{name}}`.

## Notes

- Requires a backend restart (shared `dist` was rebuilt). Existing emails keep
  their old baked values until re-rendered (any scope/value edit, or
  regeneration) — new generations get merge tags immediately.

## Verify

`tsc` clean for backend and client. In-app: a dynamic variable shows `{{name}}`
highlighted in the preview and has no input; switching it to static reveals the
value input and bakes the value into the render.
