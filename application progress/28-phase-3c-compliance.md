---
date: 2026-05-02
area: phase 3c / compliance footer and unsubscribe
files:
  - apps/backend/prisma/schema.prisma
  - apps/backend/prisma/migrations/20260502130000_phase3-workspace-postal/migration.sql
  - packages/shared/src/workspace.ts
  - apps/backend/src/workspaces/dto/workspace.dto.ts
  - apps/backend/src/workspaces/dto/update-workspace-me.dto.ts
  - apps/backend/src/workspaces/workspaces.controller.ts
  - apps/backend/src/workspaces/workspaces.service.ts
  - apps/backend/src/sending/sending-provider.interface.ts
  - apps/backend/src/sending/resend.driver.ts
  - apps/backend/src/sending/unsubscribe-token.ts
  - apps/backend/src/sending/footer.ts
  - apps/backend/src/campaigns/campaigns.controller.ts
  - apps/backend/src/campaigns/campaigns.service.ts
  - apps/backend/src/unsubscribe/unsubscribe.module.ts
  - apps/backend/src/unsubscribe/unsubscribe.controller.ts
  - apps/backend/src/unsubscribe/unsubscribe.service.ts
  - apps/backend/src/app.module.ts
  - apps/frontend/actions/workspaces.client.ts
  - apps/frontend/components/campaigns/ComposeModal.tsx
---

# 28 — Phase 3C: compliance foundation (footer + unsubscribe)

## Implemented

- Added `Workspace.postalAddress` to Prisma + migration `phase3-workspace-postal`.
- Added `PATCH /workspaces/me` to update the authenticated user primary workspace `postalAddress`.
- Added unsubscribe token helper (`HMAC` with `JWT_SECRET`) that encodes:
  - `contactId`
  - `campaignId`
  - `deliveryId`
- Added compliance footer helper `buildComplianceFooter(workspace, contact, deliveryId)`:
  - sender name
  - postal address
  - unsubscribe URL `${APP_URL}/unsubscribe/${token}`
- Added public unsubscribe endpoints (no guards):
  - `POST /unsubscribe/:token`:
    - validates token
    - marks contact as `UNSUBSCRIBED`
    - upserts `SuppressionEntry` with reason `UNSUBSCRIBED`
  - `GET /unsubscribe/:token`:
    - static server-rendered HTML confirmation page
- Added one-click unsubscribe headers to send payload:
  - `List-Unsubscribe`
  - `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
- Added send guard in `CampaignsService.send`:
  - rejects when workspace postal address is missing
  - keeps full audience send disabled for now
- Updated compose UI to block the final send button when workspace postal address is missing.

## Deferred intentionally

- `Event(type=unsubscribed)` persistence is deferred until Event schema/module lands (Phase 4 tracking work).
