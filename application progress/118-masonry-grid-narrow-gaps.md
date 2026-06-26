# 118 — Fix masonry grid gaps on narrow viewports

## Symptom
Project/template grid showed large empty vertical gaps under shorter cards (rows aligned
to the tallest item) on narrower screens.

## Cause
`apps/client/components/global/masonry-grid.tsx` — `requestedColumnCount` returned **0**
for any width below 1024px. The `columnCount === 0` branch fell back to a CSS
`grid grid-cols-2`, which aligns items into rows → tall cards force gaps under short ones.
True column packing (flex columns) only ran at ≥1024px.

## Fix
- `requestedColumnCount`: added breakpoints — ≥640px → 2 columns, <640px → 1. Never
  returns 0 now, so the packed-masonry path runs at every width.
- `useResponsiveColumnCount`: initialize from the viewport on first client paint
  (`typeof window` guard) instead of always starting at 0.
- The `columnCount === 0` branch (SSR / first paint only) now renders a single-column
  flex stack instead of a row-aligned 2-col grid, so no gap artifact.

Packing already uses `getTemplateMasonryWeight` (aspect-ratio weights) to balance columns.

Client typecheck clean.
