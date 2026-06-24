# 115 — Open attached chat images in a lightbox

## Request
Clicking an image attached to a chat message should open it (full size).

## Change
`apps/client/components/project/editor/HumanMessage.tsx`: each attachment
thumbnail is now a button (`cursor-zoom-in`) that opens a full-screen lightbox
overlay showing the image with `object-contain`. Click the backdrop or press
Escape to close. Local `lightbox` state; no new deps.

## Files
- `apps/client/components/project/editor/HumanMessage.tsx`

## Verify
- `tsc --noEmit -p apps/client` clean.
- Manual: click an attached image in a user message → opens large; backdrop /
  Esc closes.
