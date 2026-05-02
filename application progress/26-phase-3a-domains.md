---
date: 2026-05-02
area: phase 3a / domain verification
files:
  - packages/shared/src/domains.ts
  - packages/shared/src/index.ts
  - apps/backend/prisma/schema.prisma
  - apps/backend/prisma/migrations/20260502123000_phase3-domains/migration.sql
  - apps/backend/src/common/crypto.ts
  - apps/backend/src/domains/domain-dns-records.ts
  - apps/backend/src/domains/domains.module.ts
  - apps/backend/src/domains/domains.controller.ts
  - apps/backend/src/domains/domains.service.ts
  - apps/backend/src/domains/dns-checker.service.ts
  - apps/backend/src/domains/domains-recheck.types.ts
  - apps/backend/src/domains/domains-recheck.processor.ts
  - apps/backend/src/domains/domains-recheck.scheduler.ts
  - apps/backend/src/domains/dto/create-domain.dto.ts
  - apps/backend/src/domains/dto/domain.dto.ts
  - apps/backend/src/app.module.ts
  - apps/backend/package.json
  - apps/frontend/actions/domains.ts
  - apps/frontend/components/domain/DomainScreen.tsx
---

# 26 — Phase 3A: domain verification baseline

## What was implemented

- Added shared contracts for domains and DNS checks in `@madoo/shared`:
  - `DomainSchema`, `DnsCheckSchema`, `DnsRecordSchema`, `CreateDomainInputSchema`.
- Added Prisma models:
  - `Domain` with workspace scoping, DKIM keys, status and verification timestamps.
  - `DnsCheck` with check type, expected/actual values, and check timestamp.
- Added `DomainsModule` with authenticated workspace-scoped endpoints:
  - `POST /domains`
  - `GET /domains`
  - `GET /domains/:id`
  - `POST /domains/:id/recheck`
  - `DELETE /domains/:id`
- Added DNS verification engine:
  - `DnsCheckerService` resolves SPF/DKIM/DMARC/return-path via `node:dns/promises`.
  - Domain is marked verified when at least 3/4 checks pass.
- Added queue + schedule flow for rechecks:
  - BullMQ worker `domain-dns-recheck`.
  - Scheduled enqueue every 15 minutes with `@nestjs/schedule`.
- Added crypto helper:
  - `encryptSecret()` in `apps/backend/src/common/crypto.ts`.
  - Domain private key is encrypted via AES-256-GCM with key derived from `JWT_SECRET`.
- Added frontend integration:
  - `apps/frontend/actions/domains.ts` with pure fetcher-based actions.
  - Replaced hardcoded `DomainScreen` with live list/create/recheck/delete + DNS records copy.

## Notes

- This establishes the Phase 3A backend/frontend baseline for domain setup and DNS rechecks.
- No sending pipeline or webhook integrations were included in this chunk.
