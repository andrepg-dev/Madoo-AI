---
date: 2026-06-14
area: email-template-project (preview variables editor)
files:
  - apps/client/components/project/preview/VariablesPanel.tsx
  - apps/client/app/email-template-project/page.tsx
---

# Variables panel in the email preview

Added a left-side panel inside the email preview to edit the template's
variables (values + dynamic/static scope) and re-render live. Guided by the
`apps/frontend` EditorScreen reference, rebuilt clean with the design system.

## Backend/plumbing already existed

`PATCH /v1/emails/:id/variants/:variantId/variable-schema` re-compiles the
variant HTML from `componentCode` using each variable's `default` as its value
and returns the full `EmailDto`. The client action
`updateEmailVariantVariableSchema(emailId, variantId, { variableSchema })` was
already present. So this was UI-only.

## What was built

- **`VariablesPanel`** (`components/project/preview/VariablesPanel.tsx`): lists
  `variant.variableSchema.variables`; per row a label, a role `Badge`
  (text/url/image/date), a value `Input` (type derived from role), and a
  dynamic/static `ScopeToggle`. Keeps a local draft (`values`/`scopes`) reset
  whenever the variant changes; a sticky "Save & update preview" button shows
  only when dirty. On save it calls the action and writes the returned `EmailDto`
  into the `["email", emailId]` query cache, so the preview iframe re-renders
  with the new `compiledHtml`.
- **`EmailPreviewSidebar`** (in `page.tsx`): a "Variables" toggle button in the
  preview toolbar (shown when an email + variant exist) opens the panel
  side-by-side, left of the iframe (`flex` row; panel `w-72 shrink-0`, preview
  `flex-1 min-w-0`).

## Notes

- Scope (dynamic/static) is an export concern (merge-tag vs baked value); it
  doesn't change the preview render, only the persisted schema. Editing a value
  does change the re-rendered HTML.
- Toast tones used: `success` / `danger` (from the DS `ToastTone`).

## Follow-up tweaks

- **Scope flips optimistically.** Switching dynamic↔static updates the UI
  instantly and persists in the background — it never waits on the backend (no
  disable-while-pending). On save failure the local scope reverts. The explicit
  "Save & update preview" bar keys off `valuesDirty` only (value edits still
  batch behind the button to avoid a request per keystroke). Dropped the success
  toast (the live preview is the confirmation); kept the error toast. The panel
  is keyed by `variant.id` and seeds its draft from props via `useState`
  initializers (no reset-`useEffect`), so background saves don't clobber the
  local draft.
- **Save feedback.** A subtle inline `SaveStatus` in the panel header shows
  a spinning Hugeicons `Loading03Icon` + "Saving…" while persisting and "✓ Saved"
  for ~1.8s after success (covers both scope flips and value saves). Chosen over
  a toast to avoid noise on rapid toggles.
- **Debounced auto-save, no save button.** Value edits now persist
  automatically ~600ms after the last keystroke (`handleValueChange` + a
  `saveTimer` ref); the explicit "Save & update preview" button was removed. A
  `scopesRef` keeps the debounced save from persisting a stale scope, and
  `handleScopeChange` cancels any pending value save before its immediate
  persist.
- **Toolbar toggle color fixed.** The "Variables" button used `variant="ghost"`
  with a `bg-madoo-ink` className override, but the DS `cx` doesn't tailwind-
  merge, so `bg-transparent` won and the white label was invisible. Switched to
  `variant={variablesOpen ? "primary" : "secondary"}` (no className bg).

## Verify

`npx tsc --noEmit -p apps/client/tsconfig.json` → clean. In-app: open a generated
email, click **Variables**, edit a value, **Save & update preview** → the preview
updates.
