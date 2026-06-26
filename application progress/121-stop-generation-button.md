# 121 — Stop button to cancel generation (truly aborts the LLM stream)

## Goal
A Stop button (like Claude's) that pauses generation and actually stops the backend LLM
stream — not just hides it client-side.

## Frontend
`apps/client/components/home/ClientPromptBox.tsx`
- New props `isStreaming` + `onStop`. While streaming, the send (▲) button becomes a Stop
  (■, `Square01Icon`) button that calls `onStop`; always clickable.

`apps/client/app/email-template-project/page.tsx`
- `abortRef` (AbortController) created per stream and passed as the `signal` to
  `consumeEmailSseStream` (the consumer already supported an external signal).
- `stopGeneration()` aborts it. Passed to ClientPromptBox as `onStop`, with
  `isStreaming`.
- On abort the catch settles quietly: finishes the timeline, clears the assistant
  bubble's `generating`/`buildingEmail` (keeps any partial text), no error row.
  `finally` clears `abortRef`.

## Backend — `apps/backend/src/generation/generation.service.ts`
Threaded an `AbortSignal` end-to-end so the upstream Anthropic request is cancelled:
- Each SSE Observable (generate/edit/regenerate) creates an `AbortController`, passes
  `ac.signal` down, and aborts it in the Observable teardown (Nest unsubscribes on client
  disconnect). Abort errors are swallowed (complete quietly, no error event).
- `signal` flows through runInitial / runEdit / regenerate → executeAnthropicTurn →
  runStreamWithRetry → runStream, which passes `{ signal }` to
  `anthropic.messages.stream(...)`. `stream.finalMessage()` then rejects on abort.
- Added `GenerationAbortedError` + `isAbortError()` (covers our error,
  `APIUserAbortError`, and DOM `AbortError`). The retry wrapper does not retry aborts; the
  tool loop checks `signal.aborted` between turns.

## Result
Pressing Stop aborts the fetch AND tears down the backend Observable → Anthropic request
is cancelled (stops token generation/billing). Both apps typecheck clean.
