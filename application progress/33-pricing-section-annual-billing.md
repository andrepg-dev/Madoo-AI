# 33 — Pricing Section & Annual Billing

## Summary
Implemented full pricing redesign at `/settings/billing` matching the Mailmint AI design prototype, plus added end-to-end annual billing support across the stack.

## Changes

### `packages/shared/src/billing.ts`
- Added `PLAN_PRICES_ANNUAL` (20% off monthly prices: STARTER=$15, GROWTH=$39)
- Added `BillingInterval = "MONTHLY" | "ANNUAL"` type
- Updated `CreateCheckoutSessionInputSchema` to include `interval: z.enum(["MONTHLY","ANNUAL"]).default("MONTHLY")`

### `apps/backend/src/billing/dto/create-checkout-session.dto.ts`
- Added optional `interval?: "MONTHLY" | "ANNUAL"` field with class-validator decorators

### `apps/backend/src/billing/billing.service.ts`
- `PLAN_TO_PRICE_ENV` now maps each plan to both MONTHLY and ANNUAL Stripe price env vars
  - New env vars required: `STRIPE_PRICE_STARTER_ANNUAL`, `STRIPE_PRICE_GROWTH_ANNUAL`
- `createCheckoutSession` accepts `interval` param and selects the correct Stripe price ID
- Session metadata now records `interval` alongside `plan` and `workspaceId`
- `parsePlanFromPrice` updated to also check annual price IDs as fallback

### `apps/backend/src/billing/billing.controller.ts`
- Passes `body.interval ?? "MONTHLY"` to `billing.createCheckoutSession`

### `apps/frontend/app/settings/billing/page.tsx`
- Full redesign matching design prototype:
  - Current plan status card (preserved existing API wiring)
  - Editorial hero header with Monthly/Annual toggle
  - 4-column plan grid: Free, Starter, Growth (highlighted, elevated), Scale (talk to sales)
  - Per-plan feature lists with check/X icons
  - Trust strip (guarantee, SOC2, uptime, cancel)
  - FAQ accordion (5 items, animated)
- Checkout mutation now passes `{ plan, interval }` to API

## Required env vars (add to Stripe + .env)
```
STRIPE_PRICE_STARTER_ANNUAL=price_xxx
STRIPE_PRICE_GROWTH_ANNUAL=price_xxx
```
Create these as recurring/yearly prices in your Stripe dashboard at 20% off monthly amounts.

## Status
TypeScript clean (frontend). Pre-existing backend error in generation.service.ts unrelated.
