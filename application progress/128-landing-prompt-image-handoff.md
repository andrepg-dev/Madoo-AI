# 128 — Landing prompt-box image handoff into the app

Date: 2026-06-30

## Bug
Attaching/pasting an image in the landing-page prompt box, then submitting,
created the email **without** the image — the AI replied "your message came
through without an attachment."

## Root cause
The landing app (`apps/landing`, a different subdomain than the client app)
handed the prompt to the client via a URL query param only. The client's *own*
home prompt box transfers images through an in-memory store (same origin), but
that store can't cross subdomains, and a `File` can't ride a URL. Both landing
handoff paths dropped images:
- **Signed-in** → `clientPromptUrl(prompt)` → `?prompt=` (text only).
- **After-login** → AuthDialog → backend `PendingPrompt` (text only).

## Fix — upload images to S3 first, carry public URLs across
Images are uploaded to S3 server-side, then their public URLs travel the
handoff (URLs survive both a query param and the `PendingPrompt` record). The
existing generate flow already accepts `imageUrls`.

### shared (`packages/shared`)
- `prompts.ts`: `imageUrls` on `PendingPromptSchema` (default []) and
  `CreatePendingPromptSchema` (optional, `.url()`, max 8).

### backend (`apps/backend`)
- Prisma `PendingPrompt.imageUrls String[] @default([])` + migration
  `20260630120000_pending_prompt_image_urls`.
- `prompts.service`: persist `imageUrls` on create; new `uploadAttachment()`
  (PNG/JPEG/WEBP/GIF, ≤8 MB → `s3.uploadBuffer("prompt-attachments")`).
- `prompts.controller`: `POST /prompts/pending/attachments` (auth only, no
  workspace) → `{ url }`. `S3Module` wired into `PromptsModule`.
- consume already returns the row, so `imageUrls` flow back to the client.

### landing (`apps/landing`)
- `lib/compress-image.ts` (ported) + `lib/upload-prompt-image.ts` (client →
  `/api/prompt-attachments` route handler → backend; prod-safe, not a Server
  Action).
- `app/api/prompt-attachments/route.ts` and `app/api/pending-prompt/route.ts`
  (forward auth cookie to backend).
- `lib/client-app.ts`: `clientPromptUrl(..., imageUrls)` appends repeated
  `imageUrls` params.
- `HomePage.tsx`: signed-in submit uploads images, then navigates with URLs;
  anonymous submit hands the `File[]` to the dialog.
- `AuthDialog.tsx`: anonymous case uploads **after** login (the only point a
  token exists), creates a pending prompt with the URLs, redirects with its id.
  On failure, still forwards the text prompt.

### client (`apps/client`)
- `email-template-project/page.tsx`: signed-in path reads
  `searchParams.getAll("imageUrls")`; pending path uses `pendingPrompt.imageUrls`.
  Both show them in the user message and pass to `startStream("generate", …)`.

## Why upload must follow login (anonymous)
The upload endpoint needs auth; an anonymous visitor has no token until after
sign-in, and the pending prompt is created *during* sign-in. So an
auth-payload `pendingImageUrls` approach was started then reverted — the
anonymous path uploads post-login and creates the pending prompt itself.

## Known limitation
GitHub OAuth is a full-page redirect, so the in-memory `File`s are lost before a
token exists — GitHub sign-in carries the **text** prompt but not images. Google
and email/password (SPA logins) carry both.

## Verified
- `tsc --noEmit` clean: shared, backend, client, landing.
- Prisma client regenerated.

## Deploy note
Backend needs the new migration applied (`migrate deploy` runs on boot per the
prod deploy flow).
