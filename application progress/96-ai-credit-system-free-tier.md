# 96 — AI credit system (free tier daily + monthly caps)

## Goal
Make AI usage limits explicit and unambiguous, starting with the free plan:
- Free tier: **5 credits/day** (reset daily) AND **30 credits/month** cap.
- Backend deducts credits per AI generation and enforces both caps.
- For all users, the monthly window resets the moment they change plan, or — for
  a new account — one month after it was created.

## Credit model
1 credit = 1 non-failed `EmailGenerationRun` of kind `INITIAL` (the existing
"charge" record). Usage is derived by counting those runs in a time window, so
deduction is idempotent — no separate balance to drift out of sync.

## Changes
### packages/shared/src/billing.ts
- `PlanLimits` gains `dailyAiGenerations` (-1 = no daily cap).
- `PLAN_LIMITS`:
  - FREE = `{ monthly 30, daily 5, workspaces 1 }`
  - STARTER = `{ 100, 15, 5 }`, GROWTH = `{ 250, 25, 15 }`, PRO = `{ 550, 50, -1 }`
    (paid daily caps added per product: Basic 15/day, Medium 25/day, Pro 50/day)
- Usage schema reworked: `aiGenerations` (monthly) and `dailyAiGenerations`
  (daily) each `{ used, limit, remaining, resetsAt }`. `limits` exposes both caps.

### prisma + migration 20260617002000_add_credits_anchor
- `BillingSubscription.creditsAnchor DateTime @default(now())` — anchor of the
  rolling monthly window. Existing rows start their window at migration time.

### billing.service.ts
- `assertCanGenerate` now enforces daily cap first (00:00 UTC reset), then the
  rolling monthly cap from `creditsAnchor`. Unlimited (-1) caps are skipped.
- `getOverview` returns monthly + daily usage with correct `resetsAt`/`remaining`.
- `countCreditsUsed(workspaceId, since)` helper.
- `handleSubscriptionUpdated` resets `creditsAnchor = now()` whenever the plan
  changes, so upgrades refresh credits immediately.
- Date helpers: `startOfUtcDay`, `addUtcDays`, `addUtcMonths`,
  `currentPeriodStart` (rolls anchor forward one month at a time), `buildCreditUsage`.

## Assumptions (flag to product)
- Credits are **per-workspace** (matches existing billing + generation counting).
- Daily reset boundary is **00:00 UTC** (not user-local).
- Monthly window rolls from `creditsAnchor`, independent of Stripe's invoice date;
  plan change resets it immediately.
- Failed generations do not consume credits.

## Verification
- `pnpm --filter @madoo/shared build` — ok.
- `prisma generate` — ok.
- backend `tsc --noEmit` — clean.
- No tests or frontend consumers of the billing usage shape (safe to change).

## Pending
- Run `prisma migrate deploy` (DB) to apply trial/pro/credits-anchor migrations.
- Other plans' final limits to be confirmed by product (placeholders above).
