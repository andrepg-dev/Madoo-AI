# 100 — Fix: Variables button hidden after first email generation

## Problem
After the AI generated the **first** email, the "Variables" button in the
preview sidebar did not appear until the page was reloaded. Subsequent edits
were unaffected.

## Root cause
The button is gated on `variant` (`canEditVariables = Boolean(emailId && variant)`
in `EmailPreviewSidebar`). The variant only reaches the client when the
`["email", id]` query refetches.

The post-stream `void invalidateEmailState(emailId)` in `startStream`
(`apps/client/app/email-template-project/page.tsx`) runs **after**
`consumeEmailSseStream` resolves — i.e. only once the SSE connection actually
closes. The `done` event (which updates messages + preview via `streamedHtml`)
fires earlier, so the email looks generated while the email query is still
holding the pre-generation snapshot (`variants: []`). Until the stream closed
(or the 120s idle watchdog aborted), the variant never landed in cache → no
button.

On edits a variant already exists in cache from the first generation, so the
late refetch is invisible — only the first email exposed the bug.

## Fix
Trigger the email refetch as soon as the `done` event arrives, inside the
`done` handler, instead of waiting for the stream to close:

```ts
void invalidateEmailState(emailId);
```

The existing post-stream invalidate is kept as a harmless fallback (React Query
dedupes). The mid-stream messages effect early-returns while `isStreaming`, so
the refetch updates `email` (revealing the variant + button) without disturbing
the live chat timeline.

## Files
- `apps/client/app/email-template-project/page.tsx` — `done` handler in `startStream`.
