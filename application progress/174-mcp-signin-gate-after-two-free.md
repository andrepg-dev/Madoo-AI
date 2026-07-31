# 174 — MCP sign-in gate after 2 free generations

Date: 2026-07-31

## Goal

Ask the MCP user to create a Madoo account after their second generated email,
instead of letting the connector generate forever anonymously.

## Why a continuation token (and not IP or OAuth)

The MCP transport is stateless and Claude / ChatGPT remote connectors call us
from the *provider's* egress IPs — every end user looks like the same handful of
addresses, so the existing per-IP counter cannot express "this person's second
email". Real per-user identity would need MCP OAuth (authorization-server
metadata, dynamic client registration, token verification), which Madoo's
custom-JWT auth does not provide today.

Middle ground shipped here: each generation returns an opaque
`continuationToken`, and `generate_email` declares it as an optional input the
model is told to pass back. The token carries the counter for that conversation.

It is a **soft gate**: a caller who drops the token starts over. That is
acceptable because the per-IP and global daily caps still bound LLM spend — the
token exists to place the CTA, not to enforce payment.

## Changes

`packages/shared/src/public-generate.ts`
- `PublicGenerateSchema` accepts `continuationToken`.
- `PublicGenerateResultSchema` returns `continuationToken`, `freeRemaining`,
  `signInUrl`.
- New `PublicGenerateGateSchema` — the HTTP 402 body.

`apps/backend/src/public-generate/anon-session.service.ts` (new)
- HMAC-SHA256 signed, base64url, 7-day TTL, no new deps (`node:crypto`).
- Secret: `MCP_SESSION_SECRET` → `MADOO_SERVICE_TOKEN` → `JWT_SECRET` → dev
  fallback. Free limit: `ANON_FREE_PER_SESSION` (default 2).
- Invalid / tampered / expired token → fresh session (verified by a local
  round-trip + tamper test).

`apps/backend/src/public-generate/public-generate.service.ts`
- Gate checked **before** `limiter.tryConsume`, so a gated call does not burn a
  daily slot. Over the limit → `HttpException(402, { requiresSignIn, message,
  signInUrl })`. `SentryExceptionFilter` passes the body through untouched and
  does not report 4xx to Sentry.
- `signInUrl` points at the caller's last generated email
  (`/share/:publicId?intent=signup`), whose "Make yours" flow is the
  account-creation entry point; falls back to the marketing home.

`apps/mcp/src/madoo.ts` / `server.ts`
- `generateAnonymous` returns a `AnonGenerateResult | AnonGenerateGate` union;
  402 is treated as a CTA, not an error.
- `generate_email` gained the `continuationToken` input and an `outputSchema`,
  so the token travels in `structuredContent` instead of being printed as prose.
- Success text now ends with "N free emails left in this chat", or the sign-up
  link when the allowance hits zero. Gate response returns the message + link
  and tells the model to surface it.

## Follow-up

- Real account binding still requires MCP OAuth; once a user signs in, their
  MCP-generated emails are not yet moved from the shared anon workspace into
  their own.
- Progress streaming (SSE → `notifications/progress` → live `/share` page) still
  pending from note 173.
