# 87 - LLM transient errors: retry + clean chat message

## Problem

Editing the first message re-ran generation; the Anthropic stream died mid-turn
with a transient 500 (`api_error` "Internal server error", `request_id: …`). Two
issues surfaced:

1. The raw SDK error JSON was dumped verbatim into the chat as the error bubble.
2. A single transient upstream blip failed the whole edit with no retry, even
   though nothing user-visible had streamed yet.

`generateEmailStream`/`editEmailStream` caught the error and forwarded
`e.message` (the raw JSON) as the SSE `error` payload; `runStream` had no retry.

## Changes (`apps/backend/src/generation/generation.service.ts`)

- `new Anthropic({ apiKey, maxRetries: 3 })` — SDK-level retries for transient
  request-initiation failures (was default 2, now explicit/raised).
- `runStreamWithRetry()` wraps `runStream` and retries transient failures
  (overloaded / 5xx / 429 / connection drops) up to 3 attempts with linear
  backoff. **Guarded:** retries only while nothing user-visible has streamed
  (`assistant-chunk` / `code-chunk` / `subject`), so a restart can never
  duplicate assistant text, subject, or email code. Emits a `step`
  ("Retrying the AI service…") so the timeline reflects it.
- `isRetryableLlmError(error)` — true for `APIConnectionError`, and `APIError`
  with status 408/409/429/≥500 (or no status = transport).
- `formatLlmError(error)` — maps SDK errors to short human messages
  (rate-limited / overloaded / temporary / rejected) and, for anything else,
  never surfaces a raw JSON/array blob. Both SSE catch blocks now use it.

## Verification

- backend `tsc --noEmit` clean.
- Runtime check: `Anthropic.APIError/APIConnectionError/RateLimitError` resolve;
  `formatLlmError` on the exact raw-JSON message → "Something went wrong while
  generating. Please try again."; plain messages pass through unchanged.
- Backend (watch mode) recompiled and responds (auth-guarded probe → 401, not a
  crash).

## Note

The underlying 500 was an upstream Anthropic transient error, not a malformed
request (it streamed ~15s before failing). The retry recovers the common case;
the clean message covers the rest. Unrelated to the entry #86 client guard.
