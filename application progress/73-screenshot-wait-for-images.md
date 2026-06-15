---
date: 2026-06-14
area: generation (screenshot/preview + PDF export)
files:
  - apps/backend/src/generation/screenshot.service.ts
---

# Email preview/PDF missing images — fixed

## Symptom

Generated template thumbnails/preview screenshots came out with images blank or
missing (logo, product images), even though the same HTML renders all images
fine in the live iframe preview.

## Cause

`ScreenshotService.screenshotHtml` (and `pdfFromHtml`) loaded the HTML with
`page.setContent(html, { waitUntil: "domcontentloaded" })` plus a fixed 250ms
pause. `domcontentloaded` fires before `<img>` resources finish downloading, and
external images (remote URLs) routinely take longer than 250ms — so the capture
happened before they painted.

## Fix

- New private `waitForAssets(page)`: waits for every `document.images` entry to
  settle (`load` or `error`) and for `document.fonts.ready`, raced against a 12s
  timeout so a slow/broken asset can't hang the capture.
- Runs as a string-form `page.evaluate(...)` because the backend tsconfig has no
  `dom` lib (browser globals like `document` aren't typed in a function body).
- Called in both `screenshotHtml` and `pdfFromHtml` after `setContent`, before
  capture. Layout pause trimmed 250ms → 150ms.

## Verify

`tsc --noEmit` clean for apps/backend. Manual: regenerate a template with remote
images — thumbnail/preview now includes them.
