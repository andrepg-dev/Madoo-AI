# 100 — Landing prompt box: paste image + open attachment

## Goal
Let users attach an image by pasting (Ctrl/Cmd+V) into the landing hero prompt
box, and open an attached image at full size by clicking its thumbnail. Before,
only the "+" attach menu (file/image picker) worked; pasting did nothing and
thumbnails weren't clickable.

## Root cause
The prompt `<textarea>` had only `onChange` + `onKeyDown` — no `onPaste`
handler — so clipboard image data was dropped.

## Changes
- **apps/landing/components/HomePage.tsx**
  - New `onPromptPaste(event)`: reads `event.clipboardData.items`, keeps
    `kind === "file"` entries, calls `getAsFile()`, builds a `DataTransfer`,
    and feeds it to the existing `addFiles()`. Calls `preventDefault()` so the
    image's name/markup doesn't also land in the textarea. No-op when the
    clipboard has no files (plain text paste behaves as before).
  - Wired `onPaste={onPromptPaste}` onto both prompt textareas (hero
    `promptTextareaRef` + CTA `ctaPromptTextareaRef`).
  - Imported the `ClipboardEvent` React type.
  - `AttachmentPreviewList`: image thumbnail is now wrapped in a button that
    opens the blob URL in a new tab (`window.open(url, "_blank",
    "noopener,noreferrer")`, aria-label `Open <filename>`). Remove button stays
    overlaid on top.

## Verified
Local dev (next dev :3001) + Chrome: dispatched a synthetic `paste` with a PNG
File — attachment preview chip appeared, textarea stayed empty. Clicking the
thumbnail called `window.open` with the `blob:` URL. Reuses the same
`attachments` state / `AttachmentPreviewList` as the picker flow.
