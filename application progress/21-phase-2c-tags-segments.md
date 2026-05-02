---
date: 2026-05-02
area: phase 2 / backend tags segments
files:
  - apps/backend/src/tags/tags.module.ts
  - apps/backend/src/tags/tags.controller.ts
  - apps/backend/src/tags/tags.service.ts
  - apps/backend/src/tags/dto/create-tag.dto.ts
  - apps/backend/src/tags/dto/tag.dto.ts
  - apps/backend/src/segments/segments.module.ts
  - apps/backend/src/segments/segments.controller.ts
  - apps/backend/src/segments/segments.service.ts
  - apps/backend/src/segments/segment-query.ts
  - apps/backend/src/segments/dto/create-segment.dto.ts
  - apps/backend/src/segments/dto/segment.dto.ts
  - apps/backend/src/contacts/contacts.service.ts
  - apps/backend/src/app.module.ts
---

# 21 — Phase 2c tags and segments modules

## Implemented scope

- Added `TagsModule` with guarded workspace-scoped CRUD endpoints:
  - `POST /api/v1/tags`
  - `GET /api/v1/tags`
  - `DELETE /api/v1/tags/:id`
- Added `SegmentsModule` with guarded workspace-scoped endpoints:
  - `POST /api/v1/segments`
  - `GET /api/v1/segments`
  - `GET /api/v1/segments/:id`
  - `DELETE /api/v1/segments/:id`
  - `POST /api/v1/segments/:id/preview`
- Added helper:
  - `apps/backend/src/segments/segment-query.ts`
  - Exports `buildPrismaWhere(workspaceId, query): Prisma.ContactWhereInput`
- Segment create validation uses `SegmentQuerySchema` from `@madoo/shared`.
- Segment preview returns:
  - `count`
  - `sampleContacts` (mapped with `toContactDto`, max 10 rows)

## Integration details

- Registered `TagsModule` and `SegmentsModule` in `AppModule`.
- Kept `@UseGuards(JwtAuthGuard, WorkspaceGuard)` on all new controllers.
- Kept service signatures workspace-first (`workspaceId` first arg).
- Updated `ContactsService` to reuse `buildPrismaWhere` when a `segmentId` is provided in contacts list filters.

## Verification

- Build passed:
  - `pnpm --filter @madoo/backend build`
- Endpoint smoke test with valid `Authorization` + `X-Workspace-Id`:
  - Created tag via `POST /api/v1/tags`.
  - Created segment via `POST /api/v1/segments` using shared query schema shape.
  - Preview via `POST /api/v1/segments/:id/preview` returned `{ count, sampleContacts }`.

## Out of scope kept untouched

- No smart segment generation with Claude.
- No CSV import work.
