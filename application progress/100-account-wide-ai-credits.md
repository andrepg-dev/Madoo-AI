# 100 — Account-wide AI credits (one pool per user, not per workspace)

## Goal
AI credits were renewed per workspace: each `BillingSubscription` was keyed by
`workspaceId`, so every workspace a user owned got its own plan, its own rolling
monthly window, its own daily cap, and its own bonus balance. Creating a new
workspace handed the user a fresh credit pool. Fix: **one general AI-credit pool
per user account**, shared across every workspace they own, never renewed per
workspace.

## Model change
Billing is now account-wide: **one `BillingSubscription` per user**.
- `BillingSubscription.workspaceId` → `userId` (`@unique`, FK to `User`,
  `onDelete: Cascade`). Added `User.billingSubscription`, removed
  `Workspace.billingSubscription`.
- A workspace's "account" = its oldest `OWNER` member. A generation run in any
  workspace meters against that owner's shared pool.
- Credit usage = sum of non-failed `EmailGenerationRun`s (`INITIAL | EDIT`)
  across **all workspaces the account owns**, not a single workspace.

## Migration
`20260622000000_account_wide_credits` (hand-written, Postgres):
1. Add nullable `userId`.
2. Backfill from each subscription's workspace's oldest `OWNER` membership.
3. Collapse duplicates (a user owning several workspaces, each with a sub):
   keep the strongest per user — plan rank → bonusCredits → createdAt → id —
   delete the rest.
4. Drop unattributable rows, drop `workspaceId` (index + FK + column).
5. `userId` NOT NULL + unique index + FK.
Applied to dev DB via `prisma migrate deploy` — clean.

## New helper — `billing/account.ts`
Plain functions (no DI, so any module can resolve the owning account without
importing `BillingService`):
- `accountUserIdForWorkspace(db, workspaceId)` — oldest OWNER member.
- `ownedWorkspaceIds(db, userId)` — the credit-pool scope.
- `planForWorkspace(db, workspaceId)` — owner's account plan (FREE if none).

## Backend changes
- **billing.service.ts**
  - `ensureSubscription(userId)` (was `workspaceId`).
  - `getOverview` — credits resolve from the requesting user's account; usage
    counted across `ownedWorkspaceIds(userId)`. `storedTemplates` stays
    per-current-workspace.
  - `assertCanGenerate(workspaceId)` — resolves the workspace's owning account,
    meters daily/monthly/bonus across the account's workspaces.
  - `countCreditsUsed(workspaceIds[], since)` — now takes the workspace-id scope.
  - `claimTrial(userId)`, `createCheckoutSession(userId, …)`,
    `createPortalSession(userId)`, `setCancellation(userId, …)` — account-scoped;
    dropped per-workspace owner asserts.
  - Stripe: `client_reference_id` + metadata now carry `userId`; checkout/webhook
    upsert + lookup by `userId`. Referral payout calls `rewardIfQualified(userId)`.
- **billing.controller.ts** — checkout/claim-trial/portal/cancel/resume pass
  `current.sub`; only `overview` still reads the workspace (for stored-templates).
- **referrals.service.ts** — `rewardIfQualified(paidUserId)`; bonus credits land
  on the referrer's account subscription (`userId` upsert). `ReferralReward.workspaceId`
  kept as audit-only (referrer's oldest owned workspace).
- **auth.service.ts** — `applyTrialClaim(email, userId)` latches `trialClaimed`
  on the user's account subscription.
- **workspaces.service.ts** — `createForUser` reads the user's single
  subscription for the workspace-count cap (removed best-plan-across-workspaces
  aggregation).
- **templates.service.ts** / **workspace-invites.service.ts** — stored-template
  and member-seat caps read `planForWorkspace` (owner's account plan).

## Verification
- `nest build` — clean.
- `prisma generate` — clean; `prisma migrate deploy` applied the migration to dev.
- credit-window unit tests — 11/11 pass.

## Notes
- DTO shapes unchanged → no frontend changes. The billing panel now shows the
  same account-wide credits regardless of the active workspace, which is the
  intended behavior.
- `BillingController` still sits behind `WorkspaceGuard`, so the client keeps
  sending the workspace header even though billing is account-scoped (avoids a
  client change). Can be relaxed later.
