---
date: 2026-05-02
area: phase 2 / contacts schema
files:
  - packages/shared/src/contacts.ts
  - packages/shared/src/index.ts
  - apps/backend/prisma/schema.prisma
  - apps/backend/prisma/migrations/20260502110042_phase2-contacts/migration.sql
---

# 19 — Phase 2a contacts contract and schema

## What was implemented

- Added `packages/shared/src/contacts.ts` with zod contracts and inferred types:
  - `ContactSchema`
  - `TagSchema`
  - `SegmentSchema`
  - `SegmentQuerySchema`
  - `SuppressionEntrySchema`
- Added shared enums/types for contact status and suppression reason.
- Exported the new contacts contract from `packages/shared/src/index.ts`.
- Updated Prisma schema with:
  - Enums: `ContactStatus`, `SuppressionReason`
  - Models: `Contact`, `Tag`, `ContactTag`, `Segment`, `SuppressionEntry`
  - Workspace relations with cascade delete
  - Unique constraints:
    - `Contact`: `@@unique([workspaceId, email])`
    - `SuppressionEntry`: `@@unique([workspaceId, email])`

## Migration notes

- Requested command:
  - `pnpm prisma migrate dev --name phase2-contacts`
- In this repository state, `migrate dev` fails because an older migration cannot be replayed on the shadow database (`P3006` on `20260428180000_phase1_emails`).
- To still produce the phase migration artifact for this task, SQL was generated with:
  - `pnpm --filter @madoo/backend exec prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel "prisma/schema.prisma" --script`
- Output created at:
  - `apps/backend/prisma/migrations/20260502110042_phase2-contacts/migration.sql`

## Scope guard

- No Nest module, controller, service, or endpoint was created.
- No frontend files were touched.
