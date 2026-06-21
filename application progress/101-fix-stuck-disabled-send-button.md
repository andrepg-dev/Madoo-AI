# 101 — Fix send button stuck in disabled state

## Symptom
Sometimes the in-project chat box would not let the user send a message to the
LLM — the "Generate email" / send button stayed `disabled`.

## Root cause
Send button (chat variant) gate:
`apps/client/app/email-template-project/page.tsx`
```tsx
disabled={isStreaming || (Boolean(currentEmailId) && emailQuery.isLoading)}
```
Two async flags could get pinned `true`:

1. **`isStreaming` (main).** Reset only in `startStream`'s `finally`
   (`setIsStreaming(false)`), which runs only if `consumeEmailSseStream`
   settles. `consumeEmailSseStream` (`apps/client/lib/email-stream.ts`) looped
   `await reader.read()` with no timeout and no abort (`startStream` passed
   `signal = undefined`). A silent-but-open SSE stream (backend hang, idle
   proxy, LLM stall before first byte) means `read()` never resolves → `await`
   never settles → `finally` never runs → `isStreaming` stuck → button dead
   until reload.
2. **`emailQuery.isLoading` (secondary).** `useQuery` had no `staleTime`/timeout;
   a hanging `fetchEmail` kept `isLoading` true, blocking the button even though
   sending a new chat message does not need that load.

## Fix
- `apps/client/lib/email-stream.ts`
  - Added an internal `AbortController` chained to the caller's `signal`, plus a
    silence watchdog (`STREAM_IDLE_TIMEOUT_MS = 120_000`). `armIdleTimer()` is
    reset on every `reader.read()`; if no bytes/close arrive within the window
    the request is aborted with a readable Error. Abort → `read()` rejects →
    `startStream` catch shows the error → `finally` resets `isStreaming`.
  - Wrapped fetch + read loop in `try/finally` that clears the timer and removes
    the external-abort listener.
- `apps/client/app/email-template-project/page.tsx`
  - Button now `disabled={isStreaming}` only (decoupled from
    `emailQuery.isLoading`).
  - `emailQuery` got `staleTime: 15_000`.

## Verify
`npx tsc --noEmit` in `apps/client` passes.
