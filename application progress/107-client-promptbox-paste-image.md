# 107 — Paste clipboard image into ClientPromptBox

## Problem
The home prompt box (`apps/client/components/home/ClientPromptBox.tsx`) only
accepted images via the `+` attach menu (Upload image / Take photo). Pasting an
image that lives in the clipboard (copied screenshot, "Copy image" from another
app) did nothing — the paste handlers only read text.

## Fix
- Added module-level `getClipboardImages(clipboardData)` helper that pulls image
  `File`s from a clipboard payload, handling both `clipboardData.files` and the
  item-based shape (`items[].kind === "file"`) browsers use for screenshot /
  "copy image" pastes.
- `addFiles` now accepts `FileList | File[]` and is wrapped in `useCallback` so it
  is stable for the global paste effect dependency.
- New `onPromptPaste` handler wired to the `<textarea>` — when the box is focused
  and the clipboard holds images, they are attached; text pastes still fall
  through to native behavior.
- Global `paste` listener (focus-anywhere flow) now also detects clipboard images,
  focuses the prompt, and attaches them before the text branch.

## Files
- `apps/client/components/home/ClientPromptBox.tsx`

## Verify
- `npx tsc --noEmit -p apps/client/tsconfig.json` — clean.
- Manual: copy an image (screenshot / right-click Copy image), focus the prompt
  box, paste → image appears as a thumbnail attachment; pasting plain text still
  inserts text.
