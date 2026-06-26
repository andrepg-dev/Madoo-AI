# 122 — VIP comp accounts: auto-PRO on signup (growth list)

## Goal
A reviewable list of "growth" emails (streamers/creators/partners) that automatically
receive a PRO subscription when they register. First entry: hi@midu.dev (midudev).

## Code
- `apps/backend/src/billing/vip-accounts.ts` — `VIP_PRO_EMAILS` allowlist (lowercase) +
  `isVipProEmail()`. This is the growth list; add emails here (git-reviewable).
- `apps/backend/src/auth/auth.service.ts` — new `applyVipPlan(email, userId)` called in
  the session finalizer right after `applyTrialClaim` (runs on every login AND signup).
  If the email is on the list, it upserts the account's `BillingSubscription` to
  `plan: PRO, status: ACTIVE`. Idempotent, best-effort (never blocks login), and never
  touches Stripe fields — so a VIP who later actually pays keeps their billing data.

Comped PRO needs only `plan=PRO`/`status=ACTIVE`; entitlements/credits derive from the
plan + `creditsAnchor` (no Stripe period required).

## Prod database
- Checked prod: `hi@midu.dev` is NOT registered yet, so there is no `BillingSubscription`
  row to set today. When they sign up, the deployed code grants PRO automatically.
- If/when a listed user already exists, set them directly:
  `UPDATE "BillingSubscription" SET plan='PRO', status='ACTIVE' WHERE "userId"=…` (or
  upsert), then it stays PRO on every login via the code path.

## Deploy
Backend is MANUAL on prod (git pull + docker compose up --build at
/root/Madoo-AI/apps/backend). Required for the grant to take effect.
