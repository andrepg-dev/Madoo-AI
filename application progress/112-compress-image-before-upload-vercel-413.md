# 112 — Compress images client-side to beat Vercel's 4.5 MB body limit

## Problem
After the route-handler fix (#111), image upload worked locally but still failed
in production: the LLM said "no image attached" and the backend logged zero
`/images` requests. Vercel runtime logs revealed the real reason — real uploads
returned **413** at the Vercel function:

```
POST /api/emails/<id>/images 413 [serverless]
```

Vercel serverless functions (route handlers) reject request bodies over ~4.5 MB.
Product screenshots exceeded that, so the request never reached the route handler
(let alone the backend). Local dev has no such limit → it worked there.

## Fix — downscale/recompress in the browser before upload
- New `apps/client/lib/compress-image.ts`: `compressImage(file)` draws the image
  to a canvas scaled to max 1600px on the long edge and re-encodes to WebP
  (q 0.85). Files ≤1.5 MB and GIFs pass through untouched; on any failure it
  returns the original. This costs no vision quality (Anthropic downsizes to
  ~1568px anyway) and cuts token use.
- `apps/client/lib/upload-email-image.ts`: `uploadEmailImage(emailId, file)` now
  takes a `File`, compresses it, then builds the `FormData` and posts to the
  route handler.
- Call sites simplified to pass the `File` directly:
  `app/email-template-project/page.tsx` (chat + home-startup uploads) and
  `components/project/preview/VariablesPanel.tsx`.

Backend already accepts WebP and serves a public-read S3 URL, so the rest of the
pipeline is unchanged.

## Files
- `apps/client/lib/compress-image.ts` (new)
- `apps/client/lib/upload-email-image.ts`
- `apps/client/app/email-template-project/page.tsx`
- `apps/client/components/project/preview/VariablesPanel.tsx`

## Verify
- `tsc --noEmit -p apps/client` clean.
- Diagnosed via Vercel runtime logs (project `madoo-client`): 413 on real
  uploads, 401 on unauth test calls.
- After deploy: attach a large screenshot → upload returns 200, backend logs
  `POST /emails/:id/images`, the model sees the image.
