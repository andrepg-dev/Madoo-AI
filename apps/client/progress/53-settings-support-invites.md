# 53 - Settings, Support, Invites

Date: 2026-06-11

## Work

- Added shared support and invite contracts:
  - `SupportTicketSchema`
  - `CreateSupportTicketInputSchema`
  - `WorkspaceInviteSchema`
  - `WorkspaceInvitePreviewSchema`
  - `AcceptWorkspaceInviteResponseSchema`
- Added Prisma models and migration for:
  - `SupportTicket`
  - `WorkspaceInvite`
- Added backend support flow:
  - `POST /support/contact`
  - support tickets persist even when email env is not configured
  - Resend-compatible mail wrapper sends via REST when `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `SUPPORT_EMAIL_TO` are set
- Added backend workspace invite flow:
  - `POST /workspaces/current/invites`
  - `GET /workspaces/current/invites`
  - `DELETE /workspaces/current/invites/:inviteId`
  - `GET /invites/:token`
  - `POST /invites/:token/accept`
  - email-scoped accepts, duplicate-member checks, duplicate pending invite checks, 7-day expiry, and idempotent accept for existing members
- Added client actions:
  - `actions/support.ts`
  - `actions/invites.ts`
  - invite methods in `actions/workspaces.ts`
- Replaced static settings UI with real wiring:
  - profile name save and avatar upload
  - sound preference persisted in `madoo.sound.pref`
  - generation completion sound playback
  - workspace rename/slug/avatar
  - member role changes and removal
  - invite creation, copy link, pending list, delete
  - leave workspace and slug-confirmed delete workspace
  - support ticket form
- Added public invite accept page at `/invite/[token]`.

## Verification

- `pnpm --filter @madoo/backend prisma:generate`
- `./node_modules/.bin/tsc -p packages/shared/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/backend/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`

## Notes

- No build commands run.
- No dependency install was required; backend uses Resend REST API directly.
- Runtime smoke still needs local backend/client servers and migrated database.
