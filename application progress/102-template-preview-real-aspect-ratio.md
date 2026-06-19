# 102 — Template preview cards size to real email length

## Problem
Long email templates rendered "compressed" in the gallery/showcase cards.
Preview screenshots are full-height (e.g. `800x1565`), but cards forced a
**fixed short aspect ratio** per masonry index:

- `apps/client` `TemplateCard` used `object-contain` → a long email shrank into a
  short tile, so the whole email was crammed in tiny = looked compressed.
- `apps/landing` `HomePage` template cards used `object-cover object-top` with the
  same fixed aspect classes → long emails were cropped into a short box.

Screenshot generation (`ScreenshotService.screenshotHtml` →
`element.screenshot()` on `table, body`) was already correct: it captures the
full natural height. The issue was purely how the tile was sized on the frontend.

## Fix
Size each preview tile to the screenshot's **real aspect ratio**, measured from
the loaded image's `naturalWidth/naturalHeight`, clamped so extremes stay sane:

- `MIN_HEIGHT_RATIO = 0.6`, `MAX_HEIGHT_RATIO = 2.3` (height / width).
- Before load, fall back to the per-index default ratios (mirror the existing
  masonry weights `[1.25, 1.4, 1.33, 1.43, 1.5]`) so layout stays stable while
  previews stream in.
- Switched to `object-cover object-top`: when the tile matches the real ratio
  (the common case) it fills exactly with no distortion; only an unusually long
  email (clamped at the max) shows its top portion instead of being squeezed.

Result: long emails now read as **tall** cards, short emails as short cards.

## Files
- `apps/client/components/global/template-card.tsx`
  - Replaced fixed `masonryPreviewClasses` aspect with measured `heightRatio`
    state + `onLoad` measurement + inline `aspectRatio` style.
- `apps/landing/components/HomePage.tsx`
  - Extracted `TemplatePreviewImage` (stateful) so each card can measure its own
    aspect ratio; removed now-unused `templateMasonryPreviewClasses`.

## Verification
- `tsc --noEmit` clean for both `apps/client` and `apps/landing`.
