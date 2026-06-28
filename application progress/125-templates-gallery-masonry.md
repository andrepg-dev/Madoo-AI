# 125 — /templates full gallery → masonry grid

## Request
Full templates gallery page should be masonry, not fixed-height cards.

## Finding
`TemplatesGallery.tsx` used a fixed grid: `grid grid-cols-2 ... xl:grid-cols-5`
with each `GalleryCard` button forced to `aspect-3/4` and an `object-cover`
image — every card the same height regardless of the real email shape.

## Fix
- Container: `grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4
  xl:grid-cols-5` → `columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5`.
- `GalleryCard` article: `mb-7 block break-inside-avoid` (no column splits,
  vertical rhythm replaces removed `gap-y-7`).
- Button: dropped `aspect-3/4` so height follows the image.
- Image: `h-full object-cover` → `block h-auto w-full` so it renders at its
  natural ratio (tall emails = tall cards). Hover scale + overflow-hidden kept.
- No-preview placeholder keeps `aspect-3/4` so empty cards stay sensibly sized.

## Note
No reserved aspect before image load → minor layout shift as previews stream in
(homepage avoids this via `TemplatePreviewImage` default ratios). Acceptable for
the gallery; revisit if CLS matters.

## Files
- `apps/landing/components/TemplatesGallery.tsx`

## Verify
`npx tsc --noEmit` clean. Pairs with [124].
