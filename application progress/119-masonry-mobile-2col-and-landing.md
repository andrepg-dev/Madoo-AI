# 119 — Masonry: 2 columns on mobile + fix landing showcase gaps

Follow-up to #118.

## Client — `apps/client/components/global/masonry-grid.tsx`
- `requestedColumnCount`: below 1024px now always returns 2 columns (was 2 ≥640 / 1
  below). Mobile shows two packed columns.

## Landing — `apps/landing/components/HomePage.tsx`
- The category template showcase used an aligned `grid grid-cols-2 sm:grid-cols-3
  lg:grid-cols-5`, but `renderShowcaseCard` renders `TemplatePreviewImage` with varying
  `defaultHeightRatio` → row-aligned gaps under shorter cards (same bug as the app).
- Switched the container to CSS columns masonry: `columns-2 gap-4 sm:columns-3
  lg:columns-5`, and the card now has `mb-8 break-inside-avoid` so cards pack vertically
  with no row gaps.

The /templates `GalleryCard` uses a fixed `aspect-3/4` (uniform height) so its grid does
not gap — left unchanged.

Both apps typecheck clean.
