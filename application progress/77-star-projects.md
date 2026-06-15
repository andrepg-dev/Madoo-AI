---
date: 2026-06-14
area: projects (star / favorite)
files:
  - apps/backend/prisma/schema.prisma
  - apps/backend/prisma/migrations/20260614000000_add_email_starred/migration.sql
  - apps/backend/src/emails/emails.service.ts
  - apps/backend/src/emails/emails.controller.ts
  - packages/shared/src/emails.ts
  - apps/client/actions/emails.ts
  - apps/client/components/projects/ProjectLibrary.tsx
  - apps/client/app/(root-layout)/dashboard/projects/starred/page.tsx
---

# Star projects (persisted)

## Goal

Let users star/unstar a project from the project card menu and have the Starred
view actually list them. Previously "Starred" was a placeholder ("needs backend
support") and the project-page star button was local-only.

## Full-stack slice

- **Prisma**: `Email.starred Boolean @default(false)` + migration
  `20260614000000_add_email_starred`. `prisma generate` run.
- **shared**: `EmailDtoSchema.starred` (default false) + `SetEmailStarredSchema`
  / `SetEmailStarredInput`. Rebuilt `@madoo/shared` dist.
- **backend**: `EmailsService.setStarred(...)` + `toDto` now returns `starred`;
  controller `PATCH /emails/:id/star`.
- **client action**: `setEmailStarred(emailId, starred)` → PATCH, returns EmailDto.
- **ProjectLibrary**: `starMutation` (updates the `["emails"]` cache),
  `toggleStar` handler threaded as `onToggleStar` through grid card / list row /
  actions menu. Menu now has a Star/Unstar item (star icon) above Rename. Starred
  cards show an amber star badge top-right. New `starredOnly` prop filters the
  list.
- **Starred page**: now renders `<ProjectLibrary title="Starred" starredOnly />`.

## Pending / notes

- DB migration must be applied: `pnpm --filter backend prisma:migrate` (dev) or
  `prisma:deploy` (prod). Until applied, `starred` queries fail at runtime.

## Update — project-page header star wired

`ConversationTitleDropdown` now takes `emailId` + `starred` (from
`email?.starred`) and persists via a `setEmailStarred` mutation that updates the
`["email", id]` and `["emails"]` caches + toast. Disabled until an email exists.

## Verify

`tsc --noEmit` clean for apps/backend and apps/client.
