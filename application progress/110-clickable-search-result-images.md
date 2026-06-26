# 110 — Clickable search-result images (find_images tool card)

## Problem
Thumbnails rendered by the `find_images` tool card ("Searched images / Found N images")
were static `<img>` elements. User wanted to click a thumbnail to open the full image.

## Change
`apps/client/components/project/editor/ToolCalls.tsx`
- Wrapped each thumbnail in a `<button>` that sets `preview` state to the image URL.
- Added `ImageLightbox` component: fullscreen overlay (`createPortal` to `document.body`,
  `z-[100]`, dimmed + blurred backdrop) showing the image at full size via `object-contain`.
- Close on: backdrop click, Esc key, or the top-right close button (`Cancel01Icon`).
  Image click `stopPropagation` so clicking the image doesn't close it.

No backend / shared schema changes — display only.
