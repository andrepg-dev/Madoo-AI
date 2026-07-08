# 100 — Security hardening: RCE sandbox, OAuth CSRF/XSS, SSRF

Date: 2026-07-07

Security audit of the backend + fixes. No branch diff existed (only a build
artifact was dirty), so this was a full audit rather than a PR review.

## Findings & fixes

### HIGH — Server-side RCE via `node:vm` (`generation/react-to-html.service.ts`)
Model-generated TSX was executed in a `node:vm` context, which is **not** a
security boundary. The regex `BLOCKLIST` was bypassable (bracket/concat), and
the injected `console.error` leaked the outer-realm `Function` via
`.constructor` → `console.error.constructor('return process')()`. Reachable via
prompt-injection and cross-tenant via community-template share/use.

Fix:
- New `generation/react-code-guard.ts`: authoritative **AST allowlist** run
  before the vm. Denies non-allowlisted global identifiers (process, require,
  globalThis, Function, …), dangerous property names (constructor, __proto__,
  prototype), computed member access with non-literal keys, destructuring of
  those names, `require()`, dynamic `import()`, and imports/re-exports from
  modules other than `react` / `@react-email/components`.
- `react-to-html.service.ts`: call the guard from `assertSafeSource`; replace the
  real `console` in the sandbox with inert no-ops.
- Verified: all 12 seed templates + valid generated code still compile+render;
  10+ escape payloads (constructor chains, string-built keys, destructuring,
  `export * from 'child_process'`, etc.) are rejected end-to-end.

### MEDIUM — OAuth connect CSRF, no `state` (`connections/*`, client callback)
`getAuthorizeUrl` issued no `state`; the callback exchanged any `code` against
the current session → an attacker could link their mailbox to a victim account.

Fix:
- `common/crypto.ts`: `signPayload` / `verifyPayload` (HMAC-SHA256, constant-time
  compare).
- `getAuthorizeUrl(userId, provider)` now signs a `state` bound to user+provider
  (15-min TTL); `exchange` verifies it. Controller passes `@CurrentUser`.
- Shared `ExchangeConnectionInputSchema` gains required `state`.
- Client callback reads `state` from the redirect and forwards it.

### MEDIUM — Reflected XSS in OAuth callback popup (client callback route)
`popupScript` interpolated the attacker-influenceable `message` into HTML
unescaped, and the JSON payload could break out of `<script>` via `</script>`.
Fix: HTML-escape the visible text; escape `<`/`>` in the script JSON.

### MEDIUM — SSRF in `rehostImageUrl` (`generation/generation.service.ts`)
Server `fetch` of model-supplied image URLs with no private-host check and
auto-redirect follow.
Fix: new `common/ssrf-guard.ts` (`assertPublicUrl`): rejects non-http(s),
private/loopback/link-local hosts, and hostnames resolving to private IPs.
`rehostImageUrl` now fetches with `redirect: "manual"` and re-validates each hop
(max 3).

### LOW — Export proxy path-forwarder (`app/api/export/[...path]/route.ts`)
Restricted to the `emails/**/export/**` shape; rejects `.`/`..`/empty segments.

## Not changed (accepted risk)
- `EmailPreviewSidebar.tsx` iframe uses `sandbox="allow-same-origin"` (needed by
  the onLoad height-measurement); no `allow-scripts`, so LLM HTML can't run JS.

## Verification
- `tsc --noEmit` clean: backend + client. `@madoo/shared` rebuilt.
- Backend `npm test` 11/11 pass.
- Guard + end-to-end compile/render smoke tests pass.

## Follow-up (scalability, not done)
- Move compile+render off the main event loop into a worker pool (also
  defense-in-depth: run with empty env so an escape sees no secrets). `vm`
  currently blocks the event loop up to 3s on cache miss.
</content>
