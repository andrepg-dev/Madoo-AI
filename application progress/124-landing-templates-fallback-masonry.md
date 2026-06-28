# 124 — Landing templates section: fallback grid → masonry

## Request
Landing homepage templates section should be a masonry grid, not fixed-height
rows.

## Finding
`HomePage.tsx` `<section id="templates">` has two render paths:
- `hasCommunityTemplates` true → `renderShowcaseCard` in
  `columns-2 sm:columns-3 lg:columns-5` (already masonry, `break-inside-avoid`).
- else (no community templates loaded, e.g. local/dev) → `renderTemplateCard`
  in `grid gap-4 sm:grid-cols-2 lg:grid-cols-3` — a CSS grid that aligns rows to
  the tallest card → the "height determinado" look.

## Fix
Made the fallback path masonry too, mirroring the showcase:
- container `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
  → `columns-2 gap-4 sm:columns-3 lg:columns-5`
- `renderTemplateCard` article: added `mb-8 block break-inside-avoid` so cards
  don't split across columns and keep vertical rhythm.

Cards already size to the screenshot's true aspect ratio via
`TemplatePreviewImage`, so masonry now reads correctly (tall emails = tall
cards).

## Note
`/templates` full gallery (`TemplatesGallery.tsx`) still uses a fixed
`aspect-3/4` grid by design. Not changed — ask if that page should go masonry
too.

## Files
- `apps/landing/components/HomePage.tsx`

## Verify
`npx tsc --noEmit` clean.
