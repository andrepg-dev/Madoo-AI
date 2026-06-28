# 126 — Revert templates masonry grid back to fixed-height gallery

## Context
The masonry (CSS columns) templates grid added in commits `2c7adf5`,
`581e2de`, `052e7dc`, `e01ce62` was not wanted. Cards sized to each
preview's full natural height, producing uneven, overly tall columns that
looked worse than the original fixed-height gallery.

## Change
Reverted both landing components to their pre-masonry state (`bc56fa8`):

- `apps/landing/components/TemplatesGallery.tsx` — `/templates` full gallery
  back to `grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4
  xl:grid-cols-5`. `GalleryCard` back to fixed `aspect-3/4` tiles with
  `object-cover object-top` (removed `heightRatio` state, `onLoad` aspect
  measurement, and `TEMPLATE_*_HEIGHT_RATIO` clamp helpers).
- `apps/landing/components/HomePage.tsx` — homepage templates fallback grid
  back to `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`; `renderTemplateCard`
  wrapper back to non-`break-inside-avoid`. The category showcase row keeps
  its original `columns-*` caption layout (unchanged pre-masonry).

## Verification
- `npx tsc --noEmit` passes for `apps/landing`.
- No dangling references to removed masonry helpers.
