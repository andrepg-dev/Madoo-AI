# 168 — Fix MCP "Edit in Madoo" link

## Problem
MCP `generate_email` returned a broken edit link. `ctaUrl` pointed at the
landing marketing homepage with a `?ref=<publicId>` query param that **nothing
consumed** — clicking "Edit in Madoo" just dropped the user on the marketing
home, not on their email or the editor.

## Root cause
`apps/backend/src/public-generate/public-generate.service.ts` built:

```
ctaUrl = `${web}/?utm_source=...&utm_medium=connector&ref=${publicId}`
```

- `web` = `PUBLIC_WEB_URL` = landing marketing site (`madooai.com`), which has
  no `/share` route.
- No frontend code reads the `ref` query param.

## Fix
Point the edit link at the **gated client app's public `/share/{publicId}`
route** (`APP_URL`, e.g. `my.madooai.com`), which renders that exact email and
offers the "Make yours with Madoo" path into the editor. `/share` is already a
public prefix in `apps/client/middleware.ts` (no auth wall).

```
ctaUrl = `${appUrl()}/share/${publicId}?utm_source=...&utm_medium=connector`
```

- Added `appUrl()` helper: `APP_URL` → `CLIENT_APP_URL` → `webUrl()` fallback.
- `webUrl()` retained for the email footer (correctly → landing).
- Updated stale `AnonGenerateResult.ctaUrl` doc comment in `apps/mcp/src/madoo.ts`.

## Files
- `apps/backend/src/public-generate/public-generate.service.ts`
- `apps/mcp/src/madoo.ts`

## Verify
- `npx tsc --noEmit` clean in backend.
- Requires `APP_URL` set in backend prod env (already used by billing,
  connections, workspace invites).
