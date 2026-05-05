---
date: 2026-05-05
area: backend / frontend / billing / observability / polish
files: prisma schema + migration, billing module, shared billing types, health + logger + sentry wiring, settings/billing UI, ui Skeleton+Toast, app error boundaries
---

# 32 — Phase 5: billing + observability + polish

Implements the master-plan Phase 5 backbone: Stripe billing state, plan
limits, structured logs + Sentry capture, richer health checks, and UI
polish primitives (toasts/skeletons/error boundaries).

## Backend

- **Schema** (`20260505200000_phase5_billing`):
  - Added `Plan { FREE, STARTER, GROWTH }`.
  - Added `SubscriptionStatus { ACTIVE, TRIALING, PAST_DUE, CANCELED, INCOMPLETE, UNPAID }`.
  - Added `BillingSubscription { workspaceId (unique), stripeCustomerId?, stripeSubscriptionId?, plan, status, currentPeriodEnd?, cancelAtPeriodEnd }`.
  - `Workspace` now has a `billingSubscription` relation.

- **BillingModule** (`src/billing/`):
  - `GET /api/v1/billing/overview` returns current plan + status + usage.
  - `POST /api/v1/billing/checkout-session` (owner/admin) creates Stripe Checkout session for `STARTER` / `GROWTH`.
  - `POST /api/v1/billing/portal-session` opens Stripe customer portal.
  - `POST /api/v1/webhooks/stripe` validates signature with `STRIPE_WEBHOOK_SECRET` and applies subscription state transitions.
  - Handles Stripe v22/dahlia typing via local aliases in `stripe-types.ts`.

- **Plan-limit enforcement**:
  - `ContactsService.create()` now checks plan capacity before adding a contact.
  - CSV import confirmation pre-checks contact limits before queueing.
  - `CampaignsService.send()` blocks sends when audience size exceeds plan limit.

- **Observability**:
  - Added `nestjs-pino` with request logging + sensitive-header redaction.
  - Added backend Sentry bootstrap (`SENTRY_DSN`) + global exception filter for 5xx capture.
  - Expanded `/api/v1/health` to include:
    - DB ping (`SELECT 1`)
    - Redis ping (`REDIS_URL`)
    - Config presence checks for Anthropic/Resend/Stripe keys

## Shared

- Added `packages/shared/src/billing.ts`:
  - `PlanSchema`, `SubscriptionStatusSchema`
  - `PLAN_LIMITS`, `PLAN_PRICES`, `PLAN_DISPLAY_NAMES`
  - Billing DTO schemas (`BillingOverviewSchema`, checkout/portal responses)
  - `PLAN_LIMITS`: `FREE.contacts = 100`, `STARTER.contacts = 1000`, `GROWTH.contacts = 5000`
- Re-exported from `packages/shared/src/index.ts`.

## Frontend

- **Billing actions**:
  - Added `actions/billing.ts` (`overview`, `createCheckoutSession`, `createPortalSession`, query keys).

- **Billing page**:
  - New route `app/settings/billing/page.tsx`.
  - Shows current plan, contacts usage, upgrade cards, checkout redirect, and portal redirect.
  - Added skeleton loading state for overview + plan cards.

- **Settings page**:
  - Added entry card linking to billing page.
  - Postal-address save now emits toast success/error feedback.
  - Added skeleton state while workspace settings load.

- **Sidebar**:
  - Replaced static “Free plan” widget with live billing usage card (plan + contacts used + CTA).

- **Global UI polish primitives**:
  - Added `Skeleton` component in `@madoo/ui`.
  - Added `Toaster` + `useToast` in `@madoo/ui`.
  - Wired toast provider in frontend layout.
  - Added reusable `ErrorScreen` and route-level App Router error boundaries:
    - `app/error.tsx`
    - `app/contacts/error.tsx`
    - `app/campaigns/error.tsx`
    - `app/analytics/error.tsx`
    - `app/domain/error.tsx`
    - `app/settings/error.tsx`

- **Sentry (frontend)**:
  - Added `instrumentation.ts` (server/edge init + request error hook).
  - Added `instrumentation-client.ts` (browser init + router transition hook).

## Verification

- `pnpm exec tsc --noEmit` clean for:
  - `apps/backend`
  - `apps/frontend`
  - `packages/shared`
- `apps/backend`: `pnpm build` clean.
- `ReadLints` on edited paths: no diagnostics.

## Known follow-up

- `apps/frontend` production build currently fails during “Collecting page data”
  with `PageNotFoundError: Cannot find module for page: /_document`.
  This appears unrelated to the billing/observability feature code (type-checks
  and compilation pass). Keep tracking as a separate Next.js build/runtime issue.
