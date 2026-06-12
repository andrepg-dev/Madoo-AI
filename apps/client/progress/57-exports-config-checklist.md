# 57 — Phase 7 config checklist

What to configure to make exports work. File in `apps/backend/.env`.

## File exports (7A) — no config

HTML / PNG / JPEG / PDF work out of the box. Needs Puppeteer Chrome:
`cd apps/backend && npx puppeteer browsers install chrome` (one time).

## ESP + payload (7B) — no config

Downloadable HTML / JSON. Nothing to set.

## Gmail / Outlook drafts (7C) — required

```env
# Token encryption (generate: openssl rand -base64 32). Falls back to JWT_SECRET in dev.
TOKEN_ENCRYPTION_KEY=

# Gmail — reuses Google OAuth client
GOOGLE_CLIENT_ID=        # already set
GOOGLE_SECRET_ID=        # client secret (was blank)

# Outlook — Microsoft Graph
MS_CLIENT_ID=
MS_CLIENT_SECRET=
MS_TENANT=common
```

## Provider console setup

**Google Cloud** (console.cloud.google.com):
- Enable **Gmail API**.
- OAuth client → add redirect URI: `http://localhost:3003/api/connections/gmail/callback`
- `gmail.compose` is restricted → add yourself as **test user** (unverified app).

**Azure** (portal.azure.com → App registrations):
- New registration → copy client id → create client secret.
- Add Web redirect URI: `http://localhost:3003/api/connections/outlook/callback`
- API permissions: `Mail.ReadWrite`, `offline_access` (delegated).

## Sanity

- `APP_URL=http://localhost:3003` (backend) — builds the redirect URIs above.
- Restart backend after editing `.env`.
