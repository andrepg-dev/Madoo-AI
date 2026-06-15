# 83 - Landing prompt-box attachments (functional + restyled)

## Goal

The landing hero/CTA prompt boxes had a non-functional "+" button. Make
it open a working upload dropdown (image or file) and give it a clean,
compact menu using the Madoo palette (per `design.md`).

## Changes (`apps/landing/components/HomePage.tsx`)

- The "+" now opens a design-system `Dropdown` with two items —
  "Upload image" (`accept="image/*"`) and "Upload file" — each wired to a
  hidden `<input type="file">` at the page root.
- Selected files become `attachments` state (shared by both prompt
  boxes, which already share the `prompt` state). Images render as 64px
  thumbnail chips with a hover remove button; non-image files render as a
  paperclip + filename pill. Object URLs are revoked on remove/unmount.
- Menu styling follows `design.md`: design-system `Dropdown` primitives,
  paper-border surface, icon + label + chevron rows, active row filled
  with `madoo-blue-500` (the palette blue closest to the reference) and
  white text. Kept compact (`min-w-48 p-1`, `text-[13px]`,
  `px-2.5 py-1.5`).
- CTA panel switched `overflow-hidden` → `overflow-visible` so the
  upward menu isn't clipped.
- New module-level helpers: `AttachMenu`, `AttachMenuItem`,
  `AttachmentPreviewList`, and the `PromptAttachment` type.

## Note

Landing is pre-auth: submitting still opens the auth dialog and a browser
redirect can't carry `File` objects, so attachments are for compose-time
preview only and are not forwarded through the redirect.

## Verification

- landing `tsc --noEmit` passed.
