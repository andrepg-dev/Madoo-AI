---
date: 2026-07-04
area: email-rating admin-analytics
files:
  - packages/shared/src/emails.ts
  - packages/shared/src/admin.ts
  - apps/backend/prisma/schema.prisma
  - apps/backend/src/emails/emails.controller.ts
  - apps/backend/src/emails/emails.service.ts
  - apps/backend/src/admin/admin-analytics.service.ts
  - apps/backend/src/admin/admin-analytics.util.ts
  - apps/client/actions/emails.ts
  - apps/client/app/email-template-project/page.tsx
  - apps/client/components/project/editor/EmailRatingCard.tsx
  - apps/admin/app/page.tsx
  - apps/admin/components/charts-interactive.tsx
---

# 102 — Email rating + admin stats

Adds a per-email quality signal: one 1-5 star rating per `(email, user)`, with
an optional comment. It is distinct from chat-message like/dislike feedback and
only appears once an email has reached `READY` with at least one persisted
variant.

## Shared contract

- `EmailRatingInputSchema` and `EmailRatingDtoSchema` now live in
  `packages/shared/src/emails.ts`.
- `AdminRatingStatsSchema` is included in `AdminDashboardSchema` as
  `ratingStats`.
- `@madoo/shared` dist was rebuilt so backend/client/admin imports resolve.

## Backend

- New `EmailRating` Prisma model with `(emailId,userId)` uniqueness and cascade
  relations to `Email` and `User`.
- Migration `20260704120000_add_email_rating` was hand-authored because the
  local dev DB at `localhost:5433` was not reachable during `prisma migrate dev`.
- `GET /v1/emails/:id/rating` returns the current user's rating or `null`.
- `PUT /v1/emails/:id/rating` validates the shared schema, requires workspace
  membership, rejects emails that are not `READY` or have no variants, then
  upserts the rating.
- Admin analytics now returns overall average, total ratings, fixed 1-5
  distribution, and per-template averages. Emails without a template group under
  `No template`.

## Client/admin UI

- Client editor shows a small inline `Rate this email` card above the prompt box
  after first successful generation. Existing ratings prefill and can be edited.
- Admin dashboard shows average/total, a rating distribution bar chart, and a
  per-template rating list.

## Verification

- `pnpm --filter @madoo/shared build`
- `pnpm --filter @madoo/backend prisma:generate`
- `pnpm --filter @madoo/backend build`
- `pnpm --filter @madoo/client build`
- `pnpm --filter @madoo/admin build`
- `pnpm --filter @madoo/backend prisma:migrate -- --name add_email_rating --create-only`
  failed because local Postgres at `localhost:5433` was unreachable, so the
  migration SQL was written by hand.
