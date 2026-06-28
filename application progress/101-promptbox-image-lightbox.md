# 101 — Promptbox image lightbox

## What
Clicking an attached image thumbnail in `ClientPromptBox` now opens a full-size
preview (lightbox) overlay instead of doing nothing.

## Changes
- `apps/client/components/home/ClientPromptBox.tsx`
  - New `previewImage` state.
  - Thumbnail `<img>` wrapped in a button (`cursor-zoom-in`) that opens the preview.
  - Fixed overlay (`z-[100]`, dimmed/backdrop-blur) renders the full image with
    `object-contain`; click backdrop or close button to dismiss; image click is
    stopped from closing.
  - Escape key closes the preview (effect bound while open).
  - `removeImage` also clears `previewImage` if the removed image was open.

## Notes
- Reuses existing object URL (`image.url`); no extra allocation/revoke needed.
- Typecheck clean (`tsc --noEmit`).
