# 89 — Prompt image attachments: floating previews + agent vision + reuse in templates

## Goal
1. Landing: attached-image previews must float **outside** the prompt textarea, not inside it.
2. The email-generation agent must **see** user-attached images (vision).
3. The agent must reuse those images inside generated email templates via their S3 URLs.

## Background
- Landing composer (`apps/landing`) renders `AttachmentPreviewList` *inside* the `.madoo-paper-border` card, above the `<textarea>` — so previews looked like they were inside the input.
- Client composer already collected `File[]` (`PromptSubmitInput.images`) but only made local `createObjectURL` previews — **never uploaded** them and **never** sent anything to the agent.
- Backend `/emails/:id/images` upload endpoint already existed (`emails.service.uploadImage` → `S3Service.uploadBuffer(..., "email-images")`, public-read). It was unused by the composer.
- `generation.service` sent **text-only** model turns and its system prompt explicitly forbade vision: _"Never ask for or expect image bytes, base64, screenshots, or vision input."_

## Changes

### Part 1 — Landing UI (`apps/landing/components/HomePage.tsx`)
- Moved `AttachmentPreviewList` out of the textarea card in both composers (hero + CTA) so previews float above the card as a sibling.

### Part 2 — Shared schemas (`packages/shared/src/emails.ts`)
- Added `EmailImageUrlsSchema = z.array(z.string().url()).max(8).optional()`.
- `EditEmailSchema` now accepts `imageUrls`.
- New `GenerateEmailSchema { imageUrls? }` + `GenerateEmailInput` for the generate body.
- Rebuilt `@madoo/shared` (dist).

### Part 3 — Backend agent vision (`apps/backend`)
- `emails.controller.ts`: `generate()` now reads `@Body()` and parses `GenerateEmailSchema`; passes `imageUrls` through. `edit()` already forwards the parsed dto (now includes `imageUrls`).
- `generation.service.ts`:
  - New `buildUserMessageContent(text, imageUrls)` helper — returns plain string when no images, else a content-block array: one `{type:"image", source:{type:"url", url}}` vision block per image (cap 8) + a text block restating the prompt and listing the hosted URLs for use as `<Img src>`.
  - Threaded `imageUrls` through `generateEmailStream` → `runInitial`, and `editEmailStream` → `runEdit`.
  - System prompt: removed the anti-vision line; added an `IMAGE ATTACHMENTS` instruction — model can see attachments, must reuse the exact hosted URL as `<Img src>` (logo→header, hero/product→hero), and fall back to a placeholder image variable only when nothing is attached.
- Note: `regenerate` does not re-attach images (attachments aren't persisted) — known, acceptable.

### Part 4 — Client wiring (`apps/client`)
- `app/api/emails/[id]/generate/route.ts`: now forwards the JSON request body upstream (was dropping it).
- `app/email-template-project/page.tsx`:
  - Imported `uploadEmailImage`.
  - `submitChatPrompt`: uploads attached `File[]` to S3 (`uploadEmailImage`, best-effort per file) for the resolved email id — existing email (edit) or freshly `createEmail`d (generate) — then passes the resulting URLs into `startStream`.
  - `startStream`: new `imageUrls` param; sends `imageUrls` in the edit body and in the generate body (when present).

## Verification
- `tsc --noEmit` clean: backend, client, landing.
- `@madoo/shared` rebuilt from dist so new exports resolve.

## Follow-ups / not done
- Attached images are not persisted to the chat history, so regenerating a turn won't resend them.
- Client chat composer previews were already above the textarea; only the landing composers needed the float fix.
