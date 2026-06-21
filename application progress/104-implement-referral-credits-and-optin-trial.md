# 104 — IMPLEMENT: Share-Madoo referral credits + opt-in 7-day trial

Executes the plan in `103-plan-referral-credits-and-optin-trial.md`. Full stack:
Prisma + migration, `@madoo/shared`, backend (NestJS), client (`apps/client`),
landing (`apps/landing`). Backend / client / landing all typecheck clean;
migration applied to **local dev** only.

## Confirmed open decisions (asked at build start)
- **Reward amount**: `REFERRAL_REWARD_CREDITS = 100`.
- **Where credits land**: referrer's **first-owned workspace** (oldest OWNER
  `Membership`).
- **Daily cap**: bonus credits extend the **monthly** allowance only; the daily
  cap is still enforced.

## Data model (`apps/backend/prisma/schema.prisma`)
- `User`: `referralCode String? @unique`, `referredByUserId String?` + self
  relation `referredBy` / `referrals` (`onDelete: SetNull`), `referralRewards`
  back-relation, index on `referredByUserId`.
- `BillingSubscription`: `trialClaimed Boolean @default(false)`,
  `bonusCredits Int @default(0)`. Existing `hasUsedTrial` kept.
- New `ReferralReward` model: `referredUserId @unique` (idempotent ledger),
  `referrerUserId` (indexed, FK → User cascade), `workspaceId`, `credits`.
- Migration `20260621000000_referrals_optin_trial/migration.sql` — hand-written,
  applied to local dev via `prisma migrate deploy`. **NOT applied to prod** (see
  deployment notes).

## Shared (`packages/shared/src`) — dist rebuilt
- New `referrals.ts`: `REFERRAL_REWARD_CREDITS`, `REFERRAL_QUERY_PARAM` (`ref`),
  `MyReferralSchema`/`MyReferralDto`, `ReferralCodeFields`,
  `ClaimTrialResponseSchema`.
- `auth.ts`: spread `ReferralCodeFields` into Google/Register/GitHub input
  schemas (not login — existing accounts aren't attributed).
- `billing.ts`: `CreditUsageSchema` gains optional `bonus`;
  `CreateCheckoutSessionInputSchema` gains optional `claimTrial`.
- `index.ts`: exports `./referrals`.

## Backend (`apps/backend/src`)
- New `referrals/` module (`service`, `controller` `GET /v1/referrals/me`,
  `module`); registered in `app.module.ts`.
  - `getMyReferral`: lazily mints a unique `referralCode`, builds the share URL,
    returns invited/qualified counts + credits earned.
  - `rewardIfQualified(workspaceId)`: resolves the workspace OWNER; if referred
    and not yet rewarded, creates a `ReferralReward` and increments the
    referrer's first-owned-workspace `bonusCredits` in one transaction.
    Idempotent (unique `referredUserId`, P2002 swallowed).
- `auth.service.ts`: attribution is done **inline** (`attributeReferral`, Prisma
  only) to avoid an Auth↔Referrals module cycle. Called exactly once when a
  brand-new `User` is created — register always; Google when no prior `googleId`
  row; GitHub when `upsertOauthUser` reports `isNew` (now returns
  `{ user, isNew }`). Bad/self codes never block signup.
- `billing.service.ts`:
  - `createCheckoutSession(..., claimTrial=false)`: grants `trial_period_days`
    only when the trial is claimed (`subscription.trialClaimed` OR `claimTrial`),
    still gated by `!hasUsedTrial && !stripeSubscriptionId`. Persists the claim.
  - `claimTrial(workspaceId, userId)` (owner-only) + `POST /v1/billing/claim-trial`.
  - `handleSubscriptionUpdated`: on transition INTO a paid plan with status
    `ACTIVE` (ignores `TRIALING`), calls `referrals.rewardIfQualified`. Guarded
    on the transition; ledger absorbs webhook re-delivery.
  - `assertCanGenerate`: past the monthly base cap, allows a generation iff
    `bonusCredits > 0` and spends one (conditional `updateMany ... bonusCredits
    > 0`, never negative). Daily cap still checked first.
  - `getOverview`: monthly `aiGenerations.bonus = bonusCredits`.
- `BillingModule` / `create-checkout-session.dto.ts` updated; `BillingModule`
  imports `ReferralsModule`.

### Deviation from plan (documented)
Bonus consumption happens at **`assertCanGenerate`** time (one central place),
not per run-record across the 3+ generation call sites. Rationale: a single
chokepoint already gates every generation; spreading transactional decrements
across `emails.service` + `generation.service` completion paths is fragile. Cost:
a generation that is permitted by a bonus credit and then *fails* still spends
that credit (rare). The `bonusCredits > 0` guard prevents a negative balance.

## Client (`apps/client`)
- `actions/referrals.ts`: `fetchMyReferral`. `actions/billing.ts`: `claimTrial`
  + `claimTrial` threaded into `createCheckoutSession`.
- `components/settings/ReferralPanel.tsx`: share link + copy + stats with the
  **explicit rule copy** ("You earn N credits only when someone you invite
  subscribes to a paid plan…"). Wired into `settings-view.tsx` as a new Account
  nav item "Refer & earn" (`sparkle` icon, slug `referral`) and into
  `settings/[section]/page.tsx` titles.
- `components/settings/BillingPanel.tsx`: monthly meter shows "+N bonus".
- `components/shell/PricingDrawer.tsx`: trial-eligible FREE users (no Stripe
  customer) get a "Start 7-day free trial" CTA (passes `claimTrial: true`)
  alongside "Subscribe now"; inline FAQ trial copy updated.

## Landing (`apps/landing`)
- `lib/referral.ts` + `components/ReferralCapture.tsx` (mounted in
  `app/layout.tsx`): persist `?ref=CODE` to `localStorage`.
- `components/AuthDialog.tsx`: attaches `referralCode` to the signup POST and to
  the GitHub OAuth `state`.
- `app/api/auth/[provider]/route.ts` + `github/callback/route.ts`: forward
  `referralCode` to the backend (register/google/github; not login).
- `components/PricingFaq.tsx`: trial answer rewritten as opt-in + new referral
  FAQ entry (uses `REFERRAL_REWARD_CREDITS`).

## New env var
- `LANDING_URL` (backend): base for the referral share URL. Falls back to
  `APP_URL`, then `https://madooai.com`. Set it for correct dev links.

## Deployment notes
- **Prod migration pending review** — apply `20260621000000_referrals_optin_trial`
  to prod (Postgres 16) only after review + backup (SSH tunnel
  `ssh -L 5440:localhost:5433 root@178.104.69.183`; dump with a `postgres:16`
  container). Existing rows: `trialClaimed=false`, `bonusCredits=0` (defaults).
- Rebuild `@madoo/shared` dist in the build pipeline.
- Set `STRIPE_TRIAL_PERIOD_DAYS` / `LANDING_URL` as needed.

## Manual test checklist (not yet exercised end-to-end)
- Signup with `?ref=` sets `referredByUserId` once; returning login doesn't.
- Invitee FREE/trial → no reward; invitee charged ACTIVE → one reward,
  referrer `bonusCredits += 100`.
- Bonus spent only past monthly cap, never below 0, daily cap still enforced.
- Checkout without claim → immediate charge; with claim → 7-day trial,
  `hasUsedTrial` latches.
- `getOverview` surfaces bonus.
