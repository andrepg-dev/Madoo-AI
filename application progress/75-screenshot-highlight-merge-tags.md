---
date: 2026-06-14
area: generation (preview screenshot — merge-tag highlight)
files:
  - apps/backend/src/generation/screenshot.service.ts
  - apps/backend/src/emails/emails.service.ts
  - apps/backend/src/generation/generation.service.ts
  - apps/backend/src/scripts/backfill-email-previews.ts
---

# Preview screenshots highlight merge tags

## Goal

The in-app iframe preview highlights `{{variable}}` merge tags (blue text + light
blue pill, via `highlightMergeTags` in the project page). The backend preview
screenshot rendered the same `compiledHtml` but showed raw, unhighlighted
`{{recipientName}}`. Make the preview screenshot match.

## Implementation

- `ScreenshotService.screenshotHtml` gained `options.highlightVariables`.
- New private `highlightMergeTags(page)` runs the same transform as the client
  (TreeWalker over text nodes only — never attributes, so `href={{ctaUrl}}` etc.
  stay intact) inside the puppeteer page via a `String.raw` `page.evaluate`
  string (backend tsconfig has no `dom` lib). Same style as the client:
  `color:#2f6fea;background:rgba(47,111,234,0.12);border-radius:3px;padding:0 3px;font-weight:600;`.
- Called after `waitForAssets`, before capture, only when the option is set.

## Scope

Highlight enabled only for in-app previews:
`emails.service` (createPreviewUrl), `generation.service` (variant preview),
`backfill-email-previews` script. Left OFF for `exports.service` image export and
`pdfFromHtml` — real deliverables must keep raw tokens for the ESP to replace.

## Verify

`tsc --noEmit` clean for apps/backend.
