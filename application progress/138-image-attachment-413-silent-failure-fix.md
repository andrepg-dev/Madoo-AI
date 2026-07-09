# 138 — Image attachment 413 silent failure fix

## Problem

Users attached an image in the editor chat, the thumbnail rendered in their
message bubble, but the AI replied "I don't see an image attached". Confirmed
in prod (2026-07-09, email `cmrcwsvgd0004xv6ejemek5k0`).

## Root cause

Vercel rejects request bodies over ~4.5 MB with a bare **413** before the
`/api/emails/[id]/images` route handler even runs. Vercel runtime logs showed
both upload attempts returning 413; the backend never received a single
`POST /emails/:id/images` (prod DB rows for those turns have `imageUrls = {}`,
while July 6 rows have S3 URLs — upload path itself works for files under the
limit).

The failure was invisible because of two compounding gaps:

1. `compressImage` skipped GIFs entirely, so a large meme GIF went up at full
   size and hit the 413.
2. `uploadImages` in `email-template-project/page.tsx` was "best-effort":
   `catch { return [] }` — the edit stream continued with no `imageUrls`, the
   model got a text-only message, and the chat bubble still showed the local
   object-URL preview, so the UI claimed success.

## Fix (client only — backend untouched)

- `lib/compress-image.ts`
  - GIFs over 4 MB are flattened to a static webp frame (small GIFs keep
    animation); second compression pass (1280px / q0.7) for stubborn files.
  - New hard guard: if a file cannot be shrunk under `MAX_UPLOAD_BYTES`
    (4 MB), throw `ImageTooLargeError` instead of sending a doomed request.
- `lib/upload-email-image.ts` — 413 responses map to a human message
  ("The image is too large to upload…").
- `app/email-template-project/page.tsx`
  - Chat sends: uploads use `Promise.allSettled`; any failure appends a
    visible error message in the chat; if **all** attachments fail, the send
    aborts before streaming so no AI credit is spent on a request the model
    cannot fulfill. Failure captured to PostHog as
    `email_image_upload_failed`.
  - Landing→project handoff path: same allSettled + visible error (generation
    still proceeds there since the prompt is the primary payload).

## Verification

- `tsc --noEmit` clean.
- Prod evidence chain: Vercel logs (413s at 02:52/02:53 UTC), backend docker
  logs (edit POST present, zero images POSTs), prod DB `EmailChatMessage`
  rows (`imageUrls` empty for failing turns, populated July 6).

## Deploy

Frontend on Vercel (deployed with `vercel --prod`). Backend not touched —
checked prod server (docker logs, DB): healthy, no errors.
