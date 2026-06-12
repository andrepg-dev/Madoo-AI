# 56 — Phase 7C: Gmail / Outlook OAuth drafts

Date: 2026-06-11

## Goal

Make the **Application** tab's Gmail and Outlook (App + Web) cards create real
drafts via OAuth, with encrypted token storage and auto-refresh.

## Shared (`packages/shared/src`)

- New `connections.ts`:
  - `ConnectionProviderSchema` (`gmail|outlook`).
  - `ProviderConnectionDtoSchema`, `ProviderConnectionListSchema`.
  - `AuthorizeUrlResponseSchema`, `ExchangeConnectionInputSchema`,
    `CreateDraftResponseSchema` (`{ ok, provider, openUrl }`).
- Exported from `index.ts`.

## Prisma

- `enum ConnectionProvider { GMAIL OUTLOOK }`.
- `model ProviderConnection { userId, provider, accessTokenEnc, refreshTokenEnc?,
  expiresAt?, accountEmail?, @@unique([userId, provider]) }` + `User` relation.
- Migration `20260611003000_add_provider_connections`. `prisma generate` run.

## Backend

- `common/crypto.ts`: added `decryptSecret` (AES-256-GCM, mirrors `encryptSecret`).
- New `src/connections/` module (`@UseGuards(JwtAuthGuard)`, per-user):
  - `GET /connections`, `GET /connections/:provider/authorize-url`,
    `POST /connections/:provider/exchange`, `DELETE /connections/:provider`.
  - `ConnectionsService`: builds Google (scope `gmail.compose`,
    `access_type=offline&prompt=consent`) and Microsoft
    (`login.microsoftonline.com/common`, scope `offline_access Mail.ReadWrite`)
    authorize URLs; exchanges + refreshes tokens; stores them encrypted with
    `TOKEN_ENCRYPTION_KEY` (falls back to `JWT_SECRET`); fetches account email.
  - `createGmailDraft` (RFC822 MIME → base64url → Gmail drafts API) and
    `createOutlookDraft` (Graph `POST /me/messages`, `isDraft`). Each returns
    `{ ok, provider, openUrl }`. Expired tokens auto-refresh; missing refresh
    token → reconnect error.
- `ExportsController` adds `POST :id/export/gmail-draft` and
  `:id/export/outlook-draft` (resolve variant → inline CSS → ConnectionsService).
- `.env.example`: `TOKEN_ENCRYPTION_KEY`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`,
  `MS_TENANT=common` (Gmail reuses `GOOGLE_CLIENT_ID`/`GOOGLE_SECRET_ID`).

## Client

- New `actions/connections.ts`: `fetchConnections`, `getConnectionAuthorizeUrl`,
  `disconnectConnection`, `createGmailDraft`, `createOutlookDraft`.
- New `app/api/connections/[provider]/callback/route.ts`: OAuth popup target —
  exchanges code via backend (cookie → Bearer), then `postMessage` result to the
  opener and closes.
- `ExportProviderModal`:
  - `["connections"]` query for connected state.
  - `openConnectPopup` helper opens consent popup, resolves on `postMessage`.
  - Gmail / Outlook cards: ensure connected (popup if needed) → create draft →
    open drafts URL in a new tab + success toast. Errors surfaced as danger toast.

## Notes / risks

- `gmail.compose` is a restricted scope: unverified-app warning in dev — add test
  users in Google Cloud and enable the Gmail API. Token-refresh failure surfaces
  a "reconnect" error.
- Redirect URI must be registered for both providers:
  `http://localhost:3003/api/connections/{gmail|outlook}/callback`.

## Verification

- `tsc` clean across shared/backend/client.
- Live OAuth smoke pending provider app credentials + running servers.
