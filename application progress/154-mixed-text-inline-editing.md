# 154 — Inline editing for text mixing literals and variables

Date: 2026-07-13
Branch: main (bd84927)

## Problem

In the visual editor, paragraphs whose TSX interleaves literal text with
variable references — e.g. `Hi {recipientName},` or
`by {articleAuthor} — it's the clearest map…` — carried no `data-m-text`
attribute, so double-click showed only Ask AI / Delete and "Edit text" was
missing. Users read this as "editing randomly doesn't work" since visually the
content is just text.

## Fix (backend tagger + setText)

`apps/backend/src/emails/tsx-visual-ops.ts`:

- `textBindingOf` gained a third binding kind `mixed`: every significant child
  is a plain text piece — `JSXText`, a `{"…"}` string literal, or an
  identifier bound to a prop with a string default. Nested elements still make
  content non-editable (inline editing would flatten markup).
- The tagger emits `data-m-text="mixed"` for those elements; the frontend
  needed no changes (Edit text button and dblclick already key off the
  attribute being present).
- `setText` on a mixed element falls into the existing replace-children path:
  the whole content becomes the typed text, so inline variables become static
  copy for that element. Variable defaults are untouched.

## Tests

`tsx-visual-ops.spec.ts`: new sample line `Greetings {headline}, glad you are
here.` placed after the Button (placing it between the paragraph and the
Button broke the move-op neighbor assertions); asserts `data-m-text="mixed"`
tagging and whole-content replacement on setText. 48/48 pass.

Live-verified in the running app: `Hi {{recipientName}},` and the
`{articleAuthor}` paragraph now open the inline editor on double-click
(4 mixed elements tagged in the sample template); Escape still cancels.

## Deploy

Prod backend redeploy required (manual: git pull + docker compose up --build
at /root/Madoo-AI/apps/backend). Note: server keeps local, uncommitted
hardening edits to `apps/backend/docker-compose.yaml` (loopback port binds,
Redis auth, pre-encoded DATABASE_URL) and a Dockerfile tweak building
@madoo/shared before the backend — stash/pop around pulls, do not discard.
Dockerfile base bumped to node:22-alpine (439c7f3) because the repo's
packageManager is pnpm 11, which needs Node ≥ 22.13.
