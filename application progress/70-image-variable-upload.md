---
date: 2026-06-14
area: email variables (image upload to S3)
files:
  - apps/backend/src/s3/s3.service.ts
  - packages/shared/src/emails.ts
  - apps/backend/src/emails/emails.controller.ts
  - apps/backend/src/emails/emails.service.ts
  - apps/backend/src/generation/generation.service.ts
  - apps/client/actions/emails.ts
  - apps/client/components/project/preview/VariablesPanel.tsx
---

# Image upload for image-role variables (drag & drop → S3)

Users can now upload an image for an `image`-role static variable; it's stored
on S3 and the URL becomes the variable value, so the preview re-renders with it.
Dragging another image replaces it.

## Backend

- `S3Service.uploadBuffer`: map content-type → extension for png/jpeg/webp/gif
  (was png-or-jpg only); already uploads `public-read`.
- `POST /v1/emails/:id/images` (`FileInterceptor("file")`) →
  `emails.service.uploadImage`: workspace-scoped, validates type
  (png/jpeg/webp/gif) and size (≤8 MB), uploads to the `email-images` folder,
  returns `{ url }` (`EmailImageUploadResponseSchema`).
- Generation prompt: nudge the model to bind logos/hero images to an
  `image`-role, `static` variable with a placeholder URL default, so emails
  expose an uploadable image slot.

## Client

- Action `uploadEmailImage(emailId, formData)` (multipart via `FetchWrapper`).
- `VariablesPanel`: image-role **static** variables now render an `ImageUploader`
  (drag-and-drop / click) instead of a text input — shows the current image,
  an "uploading…" spinner, and "drag a new image to replace". On success it
  calls `persistValue` (immediate save, not debounced) so the URL is written and
  the preview updates. Dynamic image variables still show the `{{name}}` chip.

## Verify

`tsc` clean for backend and client; shared rebuilt. Backend restart needed for
the new route + prompt. Requires AWS_* env vars (already used by avatars/
previews).
