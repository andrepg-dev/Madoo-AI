---
date: 2026-05-02
area: backend / campaigns / sending
files: campaigns worker, queue, audit log, campaign send endpoint
---

# 29 — Phase 3.B.2 sending batch worker

Implemented the full audience send pipeline with BullMQ queue `campaign-send`.

## What was added

- Added `CampaignSendProcessor` (`apps/backend/src/campaigns/campaign-send.processor.ts`):
  - Resolves audience from `segment.query` via `buildPrismaWhere`.
  - Excludes suppressed recipients (`SuppressionEntry`) and non-active contacts.
  - Compiles React email component once per job (`compileComponent`).
  - Processes recipients in chunks of 200.
  - Maps `variableSchema` names to contact `customFields` with default fallback.
  - Renders per-contact HTML and injects compliance footer + unsubscribe headers.
  - Leaves explicit TODOs for tracking pixel and click rewrite (phase 4).
  - Sends through `SendingProvider.sendBatch`.
  - Persists `CampaignDelivery` rows with `messageId`, `status`, and `sentAt`.
  - Marks campaign as `SENT` when done.

- Added queue constants in `apps/backend/src/campaigns/campaign-send.types.ts`.
- Wired queue + processor in `CampaignsModule`.

## Send endpoint (`POST /campaigns/:id/send`)

`CampaignsService.send` now:

- Validates campaign ownership and workspace membership.
- Validates workspace postal address.
- Validates at least one verified domain exists.
- Validates a generated variant exists.
- Validates audience count is greater than zero.
- Enqueues the `campaign-send` job and marks campaign as `SENDING`.
- Writes an `AuditLog` row (`action: "campaign.send"`).

## Audit log schema

- Added Prisma model `AuditLog` with:
  - `workspaceId`, `action`, `actorUserId`, `payload`, `createdAt`
- Added migration:
  - `apps/backend/prisma/migrations/20260502134000_phase3-audit-log/migration.sql`

## Rate limiting

- Added configurable send throttling envs:
  - `SEND_THROTTLE_TTL_MS`
  - `SEND_THROTTLE_LIMIT`
  - `CAMPAIGN_SEND_RATE_PER_SECOND`
- Added global `ThrottlerModule` configuration in `AppModule`.
- Worker applies conservative per-batch pacing using the configured rate.
