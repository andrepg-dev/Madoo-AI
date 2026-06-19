# 94 — Pro made a real Stripe plan

## Problem
The "Pro" pricing card ($95) was marketing-only. Its `checkoutPlan` pointed at
the middle-tier billing plan, so a Pro buyer was charged the middle-tier price
($50) and received middle-tier limits. The backend `Plan` enum did not include
`PRO` yet.

## Fix — PRO wired end-to-end
- **prisma/schema.prisma** — `Plan` enum gains `PRO`.
- **migrations/20260617001000_add_pro_plan** — `ALTER TYPE "Plan" ADD VALUE 'PRO'`.
- **packages/shared/src/billing.ts**
  - `PlanSchema` + `CreateCheckoutSessionInputSchema` accept `PRO`.
  - `PLAN_LIMITS`, `PLAN_PRICES` ($95), `PLAN_PRICES_ANNUAL` ($80),
    `PLAN_DISPLAY_NAMES` ("Pro") extended.
  - **Aligned middle-tier limits to its marketing card** (was
    `aiGenerations: -1` unlimited → now `250`) so Medium (250) < Pro (550)
    is meaningful.
    PRO = `{ aiGenerations: 550, workspaces: 5 }`.
- **packages/shared/src/pricing.ts** — `checkoutPlan` type adds `"PRO"`; the Pro
  card now uses `checkoutPlan: "PRO"`.
- **billing.service.ts** — `PLAN_TO_PRICE_ENV.PRO`, `parsePlanFromMetadata`
  accepts `PRO`, `parsePlanFromPrice` refactored to an id map incl. pro/proAnnual.
- **dto/create-checkout-session.dto.ts** — paid checkout accepts Basic, Medium, and Pro.
- **apps/backend/.env.example** — `STRIPE_PRICE_PRO`, `STRIPE_PRICE_PRO_ANNUAL`.

7-day trial (entry 93) is plan-agnostic, so Pro gets the trial automatically.

## Behavior change to flag
The middle-tier AI-generation limit tightened from unlimited to 250/month to
match the "Medium" marketing card.

## Stripe dashboard TODO (user)
Create a Pro product with a $95 monthly price and an $80/mo annual price; put the
two `price_...` ids in `STRIPE_PRICE_PRO` / `STRIPE_PRICE_PRO_ANNUAL`.

## Verification
- `pnpm --filter @madoo/shared build` — ok.
- `prisma generate` — ok.
- backend `tsc --noEmit` — clean.
- No exhaustive `Record<Plan>` / Plan switch in client/landing (cards iterate the
  PRICING_PLANS array), so nothing else breaks.
