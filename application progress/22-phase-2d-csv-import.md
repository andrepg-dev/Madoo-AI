---
date: 2026-05-02
area: phase 2 / contacts csv import
files:
  - apps/backend/prisma/schema.prisma
  - apps/backend/prisma/migrations/20260502111209_phase2-import-jobs/migration.sql
  - apps/backend/src/contacts/contacts.module.ts
  - apps/backend/src/contacts/contacts.controller.ts
  - apps/backend/src/contacts/contacts.service.ts
  - apps/backend/src/contacts/contacts-import.processor.ts
  - apps/backend/src/contacts/contacts-import.types.ts
  - apps/backend/src/contacts/dto/confirm-contact-import.dto.ts
  - apps/backend/src/contacts/dto/contact-import-job.dto.ts
  - apps/backend/package.json
---

# 22 — Phase 2d CSV import with BullMQ

## Pre-req check

- Confirmed Redis and Postgres are running via:
  - `docker compose ps`
- Status observed: `madoo-redis` and `madoo-postgres` both `Up` and `healthy`.

## Dependencies

- Added backend dependencies for queue/import:
  - `bullmq`
  - `ioredis`
  - `@nestjs/bullmq`
  - `multer`
  - `papaparse`
- Added dev dependency:
  - `@types/multer`

## Prisma schema and migration

- Added `ContactImportJobStatus` enum.
- Added `ContactImportJob` model:
  - `id`
  - `workspaceId`
  - `status`
  - `totalRows`
  - `processedRows`
  - `errors` (JSON array)
  - `filePath`
  - `createdAt`, `updatedAt`
- Added relation on `Workspace`:
  - `contactImportJobs ContactImportJob[]`
- Migration artifact created:
  - `apps/backend/prisma/migrations/20260502111209_phase2-import-jobs/migration.sql`

## API endpoints

- `POST /contacts/import`
  - Multipart upload (`file`) with 10MB limit.
  - Parses CSV with `papaparse` server-side.
  - Validates required header `email`.
  - Stores CSV on disk under backend `tmp/contacts-imports`.
  - Creates `ContactImportJob`.
  - Returns:
    - `{ jobId, preview, detectedColumns }`
- `POST /contacts/import/:jobId/confirm`
  - Body: `{ columnMapping }`
  - Validates mapping shape and mapped columns against CSV headers.
  - Enqueues BullMQ job `contacts-import`.
  - Marks job as `QUEUED`.
- `GET /contacts/import/:jobId`
  - Returns current import job state and progress.

## Worker

- Added `contacts-import.processor.ts` using BullMQ processor.
- Queue/job names:
  - queue: `contacts-import`
  - job: `contacts-import`
- Behavior:
  - Reads CSV from saved file path.
  - Processes rows in chunks of 500.
  - Upserts contacts by `[workspaceId, email]`.
  - Malformed email rows are skipped and logged in `errors`.
  - Does not fail entire import for row-level malformed email.
  - Updates `processedRows` and `errors` progressively.
  - Final status `COMPLETED` or `FAILED`.

## Verification

- Build passed:
  - `pnpm --filter @madoo/backend build`
- Runtime import flow tested with auth + workspace header:
  1. Upload CSV (`POST /contacts/import`) -> returned `jobId`, preview, columns.
  2. Confirm import (`POST /contacts/import/:jobId/confirm`) -> `{ ok: true }`.
  3. Poll status (`GET /contacts/import/:jobId`) -> `COMPLETED` with:
     - `totalRows: 3`
     - `processedRows: 2`
     - `errors: [{ row: 3, email: "bad-email", reason: "Malformed email" }]`

## Migration command note

- Requested command `prisma migrate dev --name phase2-import-jobs` still fails in this repo due existing historical shadow-db migration drift.
- Migration SQL was generated and applied via `prisma migrate diff` + `prisma db execute` to keep this phase unblocked.
