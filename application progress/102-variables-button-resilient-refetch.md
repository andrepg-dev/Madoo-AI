# 102 — Fix: Variables button/panel still hidden after first generation

Supersedes the partial fix in `100-variables-button-hidden-first-email.md`.

## Problem
After the AI returned the **first** generated template, the "Variables" button
and its panel did not appear until the page was reloaded. The preview itself
showed (it rides on `streamedHtml`), but the button is gated on the persisted
variant (`canEditVariables = Boolean(emailId && variant)` in
`EmailPreviewSidebar`), which comes from the `["email", id]` query.

## Why doc 100's fix wasn't enough
Doc 100 added `void invalidateEmailState(emailId)` inside the `done` handler.
That fires a **single** email refetch. The backend persists the variant
(`emailVariant.create`) and flips status `GENERATING → READY` *right before*
emitting `done` (`generation.service.ts:1589/1629/1652`). So:

- A single refetch that races the write — or lands on a lagging read replica —
  caches `variants: []` and never retries.
- The status is already `READY`, so the `GENERATING`-status poll
  (`page.tsx`) never kicks in as a fallback.

Result: the empty snapshot sticks until a manual reload. Edits were unaffected
because a variant already existed in cache from the first generation.

## Fix
`apps/client/app/email-template-project/page.tsx`

- New `refreshEmailWithVariant(emailId)`: refetches the email directly and
  **retries** (up to 6× / 400ms) until `latestVariant(fresh)` is present,
  seeding the cache via `setQueryData` each pass, then invalidates the
  peripheral queries (chat, emails list, billing) — without re-fetching the
  email key (already seeded). Replica lag is monotonic, so once a pass sees the
  variant, the later post-stream invalidate refetch is safe.
- `done` handler now calls `refreshEmailWithVariant` when the turn produced an
  email (`event.compiledHtml`); chat-only turns keep the plain
  `invalidateEmailState`.
- Also makes edit/regenerate `done` resilient (same path).

The Variables panel already defaults open (`variablesOpen` initial `true` +
effect in `EmailPreviewSidebar`), so once the variant lands both the button and
the panel show by default — matching the requested behavior.

## Files
- `apps/client/app/email-template-project/page.tsx`
  - `refreshEmailWithVariant` callback; `done` handler; `EmailDto` import;
    `startStream` deps.
