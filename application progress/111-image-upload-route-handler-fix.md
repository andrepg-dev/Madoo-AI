# 111 — Image upload moved off Server Action to a route handler (prod fix)

## Problem
Attaching an image in the chat (or home) prompt box showed the preview in the
message bubble, but the LLM always replied "no image attached". Prod backend
logs showed **zero** actual `POST /api/v1/emails/:id/images` requests ever — the
upload never reached the backend, so `uploadImages` silently returned `[]` and
no `imageUrls` were sent to generate/edit.

Root cause: `uploadEmailImage` was a **Server Action** (`actions/emails.ts` →
`FetchWrapper`). In production (client app on Vercel) the Server-Action multipart
upload silently failed to reach the backend. The SSE `generate`/`edit` **route
handlers** (`app/api/emails/[id]/...`) worked fine with the same
cookie→`API_URL` pattern. (This also means the earlier home-flow image fix #108
never actually delivered images — same broken action.)

S3 itself is fine: `uploadBuffer` sets `ACL: public-read` and returns a public
`https://<bucket>.s3.<region>.amazonaws.com/...` URL that Anthropic vision can
fetch; prod has all AWS_* env set; email preview screenshots already use it.

## Fix — mirror the working route-handler pattern
- New `apps/client/app/api/emails/[id]/images/route.ts`: POST handler reads
  auth/workspace cookies, forwards the multipart `FormData` to
  `${API_URL}/emails/:id/images`, returns the JSON.
- New `apps/client/lib/upload-email-image.ts`: client `uploadEmailImage` that
  `fetch`es that route (`credentials: "include"`) and parses the URL.
- Repointed both callers to the client helper:
  `app/email-template-project/page.tsx` and
  `components/project/preview/VariablesPanel.tsx`.
- Removed the dead Server Action from `actions/emails.ts` (+ its now-unused
  schema import) with a note pointing to the new path.

## Files
- `apps/client/app/api/emails/[id]/images/route.ts` (new)
- `apps/client/lib/upload-email-image.ts` (new)
- `apps/client/app/email-template-project/page.tsx`
- `apps/client/components/project/preview/VariablesPanel.tsx`
- `apps/client/actions/emails.ts`

## Verify
- `tsc --noEmit -p apps/client` clean.
- Manual (after deploy): attach/paste an image, send → backend logs a
  `POST /emails/:id/images` (200), the model sees the image and describes/uses
  it; image-variable uploads in the preview panel also work.
