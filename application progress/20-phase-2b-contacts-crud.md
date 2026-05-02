---
date: 2026-05-02
area: phase 2 / backend contacts crud
files:
  - apps/backend/src/contacts/contacts.module.ts
  - apps/backend/src/contacts/contacts.controller.ts
  - apps/backend/src/contacts/contacts.service.ts
  - apps/backend/src/contacts/dto/contact.dto.ts
  - apps/backend/src/contacts/dto/create-contact.dto.ts
  - apps/backend/src/contacts/dto/update-contact.dto.ts
  - apps/backend/src/contacts/dto/list-contacts-query.dto.ts
  - apps/backend/src/contacts/dto/assign-contact-tags.dto.ts
  - apps/backend/src/app.module.ts
---

# 20 — Phase 2b contacts module CRUD

## Implemented scope

- Added `ContactsModule` with controller/service/dto structure following existing backend module conventions.
- Added guarded endpoints under `/api/v1/contacts`:
  - `POST /contacts`
  - `GET /contacts`
  - `GET /contacts/:id`
  - `PATCH /contacts/:id`
  - `DELETE /contacts/:id`
  - `POST /contacts/:id/tags`
- Applied `@UseGuards(JwtAuthGuard, WorkspaceGuard)` at controller level.
- Used `@CurrentWorkspace()` and `@CurrentUser()` so service methods always receive `workspaceId` as the first argument.
- Added `toContactDto()` mapper with Date to ISO serialization and Prisma enum to shared contract status mapping.
- Added class-validator input DTOs:
  - `CreateContactDto`
  - `UpdateContactDto`
  - `AssignContactTagsDto`
  - `ListContactsQueryDto`
- Registered `ContactsModule` in `AppModule`.

## Service behavior

- Enforces workspace membership through `WorkspacesService.assertMembership`.
- Normalizes contact emails to lowercase.
- Supports paginated list (`page`, `pageSize`) and text search over `email`, `firstName`, `lastName`.
- Accepts optional `segmentId` filter by loading the segment in the same workspace and applying supported query fields (`status`, `createdAfter`, `createdBefore`, `tags` as tag ids).
- Implements tag assignment only (`POST /contacts/:id/tags`) by replacing `ContactTag` rows after validating tags belong to the same workspace.

## Verification

- Backend compile check:
  - `pnpm --filter @madoo/backend build` -> success.
- Runtime verification with valid `Authorization` and `X-Workspace-Id`:
  - `POST /api/v1/contacts` created contact successfully.
  - `GET /api/v1/contacts?page=1&pageSize=10&search=phase2b` returned the created contact in `items`.

## Out of scope kept untouched

- No CSV import endpoints.
- No Smart Segment / AI segment generation.
- No tag CRUD endpoints (only tag assignment to contacts).
