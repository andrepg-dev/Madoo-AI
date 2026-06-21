# 103 — PLAN: Share-Madoo referral credits + opt-in 7-day trial

> Planning doc only. No code written yet. A fresh session executes this.
> Repo conventions: every endpoint = shared zod schema + backend handler +
> frontend action via `fetcher` (`docs/CONVENTIONS.md`). Rebuild `@madoo/shared`
> after editing its `src`. Backend = NestJS. Client = `apps/client` (work
> target); `apps/frontend` is reference-only. Landing = `apps/landing`.

## Goal
Two linked features:
1. **Referral ("Share Madoo")**: a user shares their referral link. When an
   invited user **actually pays** for a subscription, the referrer gets a
   **one-time** credit grant. Inviting a free user grants nothing. The product
   must make this rule explicit to the user.
2. **Opt-in 7-day trial**: the free trial is NOT given by default anymore. The
   user only gets it if they **claim** it (easy, instructions in the landing
   FAQ). Otherwise checkout charges immediately (normal paid subscription).

## Locked decisions
- Credit type: **one-time** grant per distinct paid referral (not a recurring
  monthly boost).
- "Paid" trigger: **real charge only** — invitee plan is BASIC/MEDIUM/PRO AND
  status `ACTIVE`. A trial (`TRIALING`, no charge yet) does NOT qualify; the
  reward fires later if/when the trial converts to a real charge. Prevents
  trial-farming.
- Trial is **opt-in**: granted only when explicitly claimed.

## Open decisions (confirm with user at start of build)
- **Reward amount**: default proposal `REFERRAL_REWARD_CREDITS = 50`. Confirm.
- **Where credits land**: referrer's **personal/first-owned workspace**
  (oldest `Membership` with role OWNER). Confirm vs. "currently active".
- Whether bonus credits also bypass the **daily** cap (proposal: NO — bonus
  extends the monthly allowance only; daily cap still applies).

## Credit accounting model (one-time, consumable)
Current model has no balance: usage = count of `EmailGenerationRun` rows in the
rolling window; allowance = `PLAN_LIMITS[plan].aiGenerations`. To support a
one-time grant we add a **consumable balance**:
- `BillingSubscription.bonusCredits Int @default(0)` = remaining granted credits.
- `BillingService.assertCanGenerate`: after the base monthly cap is reached,
  allow generation iff `bonusCredits > 0` (daily cap still enforced).
- **Consumption**: when a generation is committed while
  `usedThisPeriod >= monthlyBaseCap`, decrement `bonusCredits` by 1 in the same
  transaction that records the run (generation path in `emails.service`/
  generation service). Never below 0.
- `BillingService.getOverview`: surface `bonusCredits` and show effective
  remaining = `max(0, monthlyCap - used) + bonusCredits` in
  `usage.aiGenerations` (add a `bonus` field to the DTO so the UI can label it).

## Data model (Prisma — `apps/backend/prisma/schema.prisma`)
- `User`:
  - `referralCode String? @unique` — the user's own share code (lazily
    generated; short, url-safe).
  - `referredByUserId String?` + self-relation
    `referredBy User? @relation("UserReferrals", fields:[referredByUserId], references:[id], onDelete:SetNull)`
    and back-relation `referrals User[] @relation("UserReferrals")`.
- `BillingSubscription`:
  - `bonusCredits Int @default(0)` (consumable referral balance).
  - `trialClaimed Boolean @default(false)` (opt-in trial flag). Keep existing
    `hasUsedTrial` to prevent repeat trials.
- New model `ReferralReward` (idempotent ledger):
  - `id`, `referrerUserId`, `referredUserId String @unique` (one reward per
    referred user → idempotent), `workspaceId` (where credits landed),
    `credits Int`, `createdAt`. Relations to `User` (referrer) with index.
- Migration: hand-write SQL under `prisma/migrations/<ts>_referrals_optin_trial/`.
  **Do NOT run against prod** — the user reviews first. (Dev apply only.)

## Shared package (`packages/shared/src`)
- New `referrals.ts`:
  - `REFERRAL_REWARD_CREDITS` constant.
  - `MyReferralDto` schema: `{ code, url, invitedCount, qualifiedCount,
    creditsEarned }`.
  - request/response schemas for attribute + claim-trial as needed.
- `billing.ts`: extend the credit-usage DTO with `bonus` (granted credits) so
  the overview can show it.
- Export new module from `index.ts`. Rebuild dist (`@madoo/shared`).

## Backend (`apps/backend/src`)
- New `referrals/` module: `referrals.service.ts`, `referrals.controller.ts`,
  `referrals.module.ts`; register in `app.module.ts`.
  - `getMyReferral(userId)`: lazily create+return `referralCode`, build share
    URL (landing `?ref=CODE`), compute stats from `ReferralReward` + referred
    users.
  - `attributeSignup(newUserId, code)`: set `referredByUserId` once at account
    creation if code valid, not self, user not already attributed.
  - `rewardIfQualified(workspaceId)`: called when a workspace becomes paid;
    resolve the workspace OWNER user; if owner has `referredByUserId` and no
    existing `ReferralReward` for that referred user → create reward + add
    `REFERRAL_REWARD_CREDITS` to the **referrer's** owner-workspace
    `bonusCredits`, in one transaction (idempotent on `referredUserId`).
- `auth.service.ts`: thread an optional `referralCode` through register /
  google / github / `upsertOauthUser`, and call `attributeSignup` exactly once
  when a brand-new `User` row is created (not on returning logins).
  - Add `referralCode?` to the relevant shared auth input schemas + the landing
    `/api/auth/*` route handlers that proxy them.
- `billing.service.ts`:
  - `createCheckoutSession`: change `grantTrial` to require an explicit claim —
    only grant `trial_period_days` when the trial is claimed
    (`subscription.trialClaimed` true, or a `claimTrial` arg), still gated by
    `!hasUsedTrial && !stripeSubscriptionId`.
  - Add a `claimTrial(workspaceId, userId)` method + route to set
    `trialClaimed = true` (owner only). (Or accept `claimTrial` boolean on the
    checkout call — pick one; a persisted flag is cleaner for the FAQ flow.)
  - `handleSubscriptionUpdated`: when a workspace transitions INTO a paid plan
    with status `ACTIVE` (real charge; ignore `TRIALING`), call
    `referrals.rewardIfQualified(workspaceId)`. Guard so it only fires on the
    first qualifying transition (idempotency handled by `ReferralReward`).
  - `getOverview` / `assertCanGenerate`: integrate `bonusCredits` per the
    accounting model above.
- Generation path: decrement `bonusCredits` when a run is consumed beyond the
  base monthly cap (transactional).

## Client (`apps/client`)
- `actions/referrals.ts`: `getMyReferral`, (optional) `claimTrial` via
  `fetcher`/`FetchWrapper`.
- "Share Madoo / Refer & earn" UI (new settings section, e.g.
  `components/settings/ReferralPanel.tsx`, linked from `settings-view.tsx`
  sections list): show the referral link + copy button + stats (invited,
  qualified, credits earned).
  - **Explicit rule copy** (the user's key requirement): e.g. *"You earn
    {N} credits only when someone you invite subscribes to a paid plan.
    Inviting people who stay on the free plan doesn't earn credits."*
- Billing UI (`components/settings/BillingPanel.tsx`): show bonus/granted
  credits in the AI-credits display.

## Landing (`apps/landing`)
- Referral capture: read `?ref=CODE` on load, persist (cookie/localStorage),
  and pass into the signup payload (`AuthDialog` → `/api/auth/*`).
- FAQ (`components/PricingFaq.tsx`): add entries explaining (a) how to **claim**
  the 7-day free trial, and (b) the referral rule (credits only for paid
  invitees).
- Pricing CTA: a clear "Start 7-day free trial" (claims it) vs "Subscribe now"
  (pays immediately) — drives `trialClaimed` / `claimTrial`.

## Edge cases / anti-farming
- Self-referral blocked (`referredByUserId !== self`).
- One reward per referred user (`ReferralReward.referredUserId @unique`).
- Reward only on real charge (`ACTIVE`), so trial-only invitees don't pay out;
  pays out later if they convert.
- Idempotent webhook (Stripe re-delivers) — ledger unique key absorbs repeats.
- Referred user who pays, cancels, re-subscribes → still one reward total.

## Testing checklist
- Signup with `?ref=` sets `referredByUserId` once; returning login doesn't.
- Invitee on FREE → no reward. Invitee starts trial → no reward. Invitee charged
  (ACTIVE) → exactly one reward; referrer `bonusCredits += N`.
- Bonus credits consumed only after monthly cap; never below 0; daily cap still
  enforced.
- Checkout without claim → no `trial_period_days` (immediate charge). With claim
  → 7-day trial, `hasUsedTrial` latches.
- `getOverview` shows bonus credits.

## Deployment notes
- Prisma migration must be applied to prod **after review** (prod is Postgres 16
  via the SSH tunnel `ssh -L 5440:localhost:5433 root@178.104.69.183`; local
  `pg_dump` is v15 → use a `postgres:16` docker container for dumps). Back up
  before migrating.
- Rebuild `@madoo/shared` dist as part of the build.

## Already done this session (not part of the above)
- Project card status badge now shows **only** the `Error` state
  (`ProjectLibrary.tsx` grid + list, `project-show-case.tsx` home). Hidden:
  Draft/Ready/Generating.
