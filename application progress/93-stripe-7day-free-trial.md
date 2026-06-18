# 93 — Stripe 7-day free trial

## Goal
Offer every workspace a 7-day free trial on its first paid subscription, with
card collected up front and automatic conversion to a paid plan when the trial
ends. Prevent trial farming via cancel-and-resubscribe.

## Context
Billing was already fully wired (`apps/backend/src/billing/`): Stripe checkout,
billing portal, webhook reducer, `BillingSubscription` model, and the
`TRIALING` status were all present. Only the trial itself was missing.

## Changes
- **prisma/schema.prisma** — `BillingSubscription` gains `trialEndsAt DateTime?`
  and `hasUsedTrial Boolean @default(false)`.
- **migrations/20260617000000_add_billing_trial_fields** — adds the two columns.
- **billing.service.ts**
  - `trialPeriodDays()` reads `STRIPE_TRIAL_PERIOD_DAYS` (default 7, `0` disables).
  - `createCheckoutSession` adds `subscription_data.trial_period_days` only when
    the workspace has never used a trial and has no existing Stripe subscription.
  - `getOverview` returns `trialEndsAt`.
  - `handleSubscriptionUpdated` persists `trialEndsAt` from `sub.trial_end` and
    latches `hasUsedTrial = true` whenever a trial exists on the subscription.
- **packages/shared/src/billing.ts** — `BillingSubscriptionSchema` gains
  `trialEndsAt: string | null` (rebuilt to dist).
- **apps/backend/.env.example** — documents `STRIPE_TRIAL_PERIOD_DAYS=7`.

## Trial-abuse guard
Trial granted only when `!hasUsedTrial && !stripeSubscriptionId`. The webhook
latches `hasUsedTrial` the moment a trial subscription is observed, so a later
cancel + resubscribe does not hand out a second free trial.

## Notes
- Card is collected at checkout (Stripe default for subscription mode), so the
  plan auto-charges when the trial ends — no extra config needed.
- Frontend does not yet consume billing overview; `trialEndsAt` is exposed in
  the shared schema ready for a trial banner when the billing UI lands.

## Verification
- `pnpm --filter @madoo/shared build` — ok.
- `prisma generate` — ok.
- backend `tsc --noEmit` — clean.
- Migration apply (`prisma migrate deploy`) pending DB access — run on deploy.
