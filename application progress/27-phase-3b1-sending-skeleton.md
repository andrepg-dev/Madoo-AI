---
date: 2026-05-02
area: phase 3b / sending pipeline skeleton
files:
  - packages/shared/src/campaigns.ts
  - packages/shared/src/index.ts
  - apps/backend/prisma/schema.prisma
  - apps/backend/prisma/migrations/20260502124500_phase3-campaigns/migration.sql
  - apps/backend/src/sending/sending-provider.interface.ts
  - apps/backend/src/sending/resend.driver.ts
  - apps/backend/src/sending/sending.module.ts
  - apps/backend/src/campaigns/campaigns.module.ts
  - apps/backend/src/campaigns/campaigns.controller.ts
  - apps/backend/src/campaigns/campaigns.service.ts
  - apps/backend/src/campaigns/dto/create-campaign.dto.ts
  - apps/backend/src/campaigns/dto/update-campaign.dto.ts
  - apps/backend/src/campaigns/dto/campaign.dto.ts
  - apps/backend/src/app.module.ts
  - apps/backend/.env.example
  - apps/backend/package.json
---

# 27 — Phase 3B.1: sending schema + Resend driver + test endpoint

## Scope implemented

- Added Phase 3.B schema foundation:
  - Prisma models `Campaign` and `CampaignDelivery`.
  - Migration `phase3-campaigns`.
- Added shared contract in `@madoo/shared`:
  - campaign status/delivery status, campaign payloads, create/update schemas.
- Added sending abstraction:
  - `SendingProvider` interface (`send(batch)`, `parseWebhook(req)`).
  - `ResendDriver` implementation using `resend` SDK.
- Added `CampaignsModule` with workspace-scoped CRUD endpoints and:
  - `POST /campaigns/:id/test`: sends one email to the logged-in user.
  - Reuses `ReactToHtmlService`.
  - Compiles component code once, renders using defaults from `variableSchema`.
  - Does not create `CampaignDelivery` rows or mutate campaign counters/state.
- Documented required sending env vars in backend `.env.example`:
  - `RESEND_API_KEY`, `APP_URL`, `SENDING_DOMAIN`.

## Explicitly not included in this chunk

- Full audience send batching.
- Tracking rewrite/pixel.
- Compliance footer injection.
- Campaign delivery counters/analytics side-effects.
