# 114 — Fix assistant reply flicker / layout shift when generation ends

## Problem
When a generation finished, the assistant reply disappeared for a moment and
then snapped back, causing a visible layout shift.

## Cause
On stream end, `isStreaming` flips to false and the post-stream
`invalidateEmailState` refetch is intentionally non-blocking (#110). The
message-merge effect runs immediately with **stale** `chatQuery.data` (the new
assistant turn isn't in the client cache yet). That rebuild
(`[...server, ...clientOnly]`) only preserves client-only `timeline`/`error`
rows — not the streamed `assistant` row — so the answer was dropped, then
reappeared a beat later when the refetch landed.

## Fix
`apps/client/app/email-template-project/page.tsx` — added an assistant-count
guard to the merge effect, mirroring the existing user-message guard: if the
rebuilt list has fewer `assistant` messages than the ones currently shown for the
active email (i.e. the refetch hasn't caught up), keep the current messages.
Once the refetch lands, the server version swaps in place with no empty frame.
Scoped to `currentEmailId` so switching projects still resets normally.

## Files
- `apps/client/app/email-template-project/page.tsx`

## Verify
- `tsc --noEmit -p apps/client` clean.
- Manual: finish a generation → the reply stays put (no disappear/reappear or
  layout shift).
