# 175 — Live progress for MCP generations

Date: 2026-07-31

## Goal

The MCP user stared at a spinner for 40-90s. Now the chat client shows what
Madoo is doing, using the same progress payloads the platform editor consumes.

## Backend

`apps/backend/src/generation/generation.service.ts`
- `generateAnonymousToCompletion` takes an optional `emit` (defaults to a no-op),
  so anonymous runs can stream like the platform ones. `runInitial` already
  threaded `emit` everywhere — nothing else changed.

`apps/backend/src/public-generate/public-generate.service.ts`
- `generate()` takes an optional `emit` and reports its own non-LLM phases
  ("Retrying the draft…", "Publishing the preview link…").
- New `generateStream()` returns `Observable<MessageEvent>`: progress payloads,
  then exactly one terminal event — `result`, `gate` (the 402 sign-in body) or
  `error`. Streaming turns the gate into an event instead of an HTTP status,
  which is why the terminal event carries a type.

`apps/backend/src/public-generate/public-generate.controller.ts`
- `POST /public/generate/stream` with `@Sse()`, same `ServiceTokenGuard` as the
  blocking route. The blocking `POST /public/generate` stays for fallback.

## MCP

`apps/mcp/src/madoo.ts`
- `generateAnonymousStreaming(input, onProgress)` + a small SSE reader
  (`readSseEvents`) that buffers partial frames and ignores malformed ones.
  Resolves with the result or the gate; throws with the backend's message on
  `error`.

`apps/mcp/src/server.ts`
- `generate_email` reads `extra._meta?.progressToken` and relays
  `notifications/progress` via `extra.sendNotification`. No token → silent.
- `describeProgress` maps events to human lines (`step`, `tool_call`,
  `brand_context`, `subject`, `meta.warning`) and drops the noisy ones
  (`thinking-chunk`, `token_usage`). Throttled to one per 700ms, deduped by
  message. Notification failures are swallowed — a client that hung up must not
  fail the generation.
- Falls back to the blocking endpoint **only if the stream never produced an
  event**; failing mid-stream would risk generating (and charging) a second
  email.

## Verified

- `tsc --noEmit` clean in both apps.
- SSE reader tested against a fake server with a frame deliberately split across
  two chunks: progress events arrive in order, `result` and `gate` both resolve
  correctly.
- Prod nginx already has `proxy_buffering off` on `/mcp`, so notifications are
  not held back.

## Still open

- Live watch page inside the platform (`/share/:publicId` subscribed to a public
  SSE while status is GENERATING) — needs a fan-out bus, not done.
- Real account binding after sign-in (needs MCP OAuth), from note 174.
