# 139 — Landing: remove Designs & Layouts collage

## Problem

The "Designs & Layouts" tab in the product-features section showed a
three-image overlapping collage (newsletter, BAC, Anthropic template shots).
The cards overlapped badly and the section looked broken.

## Change

`apps/landing/components/HomePage.tsx`:

- Dropped the `collage` flag from `featureTabImages` and deleted the
  `featureCollageImages` array.
- The feature-media column now always renders the single-image panel, so the
  Designs & Layouts tab shows `/templates/news-letter.png` in the same
  rounded frame as every other tab.
- Deleted the now-unused `public/product/design-{newsletter,bac,anthropic}.png`.

## Verification

`tsc --noEmit` clean in apps/landing.
