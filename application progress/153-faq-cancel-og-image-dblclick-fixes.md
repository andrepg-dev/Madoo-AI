# 153 — Cancel-subscription FAQ, share OG image, visual editor double-click fixes

Date: 2026-07-13
Branch: feat/visual-email-editor → merged (fast-forward) into main

## 1. FAQ: how to cancel a subscription (landing)

- `apps/landing/components/PricingFaq.tsx`: new FAQ entry "How do I cancel my
  subscription?" — separate from the trial-reservation entry — with a link to
  https://my.madooai.com/settings/billing and a screenshot of the Billing &
  usage page (`apps/landing/public/faq-cancel-plan.png`).
- `Faq` type gained optional `linkHref` and `image` fields rendered under the
  answer.

## 2. Open Graph image for shared emails

- `packages/shared/src/emails.ts`: `PublicEmailDtoSchema` now carries
  `previewUrl` (nullable).
- `apps/backend/src/emails/emails.service.ts` `getPublicByPublicId`: selects
  the latest variant's `previewUrl` and returns it after the same
  http(s)-validation used elsewhere.
- `apps/client/app/share/[publicId]/page.tsx` `generateMetadata`: sets
  `openGraph` and `twitter` metadata (summary_large_image when a preview
  exists), so shared links unfurl with the rendered template screenshot.

## 3. Visual editor: double-click exit + double-click text edit

Root cause found by instrumenting the running app (real pointer events via
browser automation):

- **Exit bounced back on**: the hook's dblclick handler exited edit mode; the
  resulting React flush ran in a microtask *during the same event dispatch*,
  re-attaching the enter-gesture dblclick listener to the same document — the
  still-bubbling event then toggled edit mode straight back on. Fixed with
  `event.stopPropagation()` in the editor's dblclick handler.
- **"Can't edit this text"**: paragraphs whose TSX mixes literal text with a
  variable (e.g. `by {articleAuthor} — …`) are intentionally not
  inline-editable (`data-m-text` absent), but double-clicking them previously
  did nothing or exited the mode. Now the dblclick behavior is split:
  - literal text → inline editor (unchanged),
  - leaf content that can't be inline-edited (variable-mixed text, images) →
    selects the element and shows the toolbar,
  - structural wrappers / background → exits edit mode.
- Escape clears the selection (and cancels drags / inline edits as before).

Verified end-to-end in the running app: enter via double-click, inline edit on
a literal heading, select-with-toolbar on a variable-mixed paragraph, exit on
background that stays exited, re-enter afterwards.

## Merge

`origin/main` had no commits missing from the branch, so the merge was a
fast-forward; pushed to `origin/main` (f1ac721).
