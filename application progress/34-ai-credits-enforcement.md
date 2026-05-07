# 34 — AI Generation Credits Enforcement

## Summary
Implemented full AI credit system: plan limits defined, enforced at generation time, and surfaced in the UI.

## Plan Limits
| Plan     | Contacts | AI Generations / month |
|----------|----------|------------------------|
| FREE     | 100      | 10                     |
| STARTER  | 1,000    | 100                    |
| GROWTH   | 5,000    | Unlimited (-1)         |

## Changes

### `packages/shared/src/billing.ts`
- Added `aiGenerations: number` to `PlanLimits` type (-1 = unlimited)
- Updated `PLAN_LIMITS` with per-plan generation counts
- Updated `BillingUsageSchema` to include `aiGenerations: { used, limit }`
- Updated `BillingOverviewSchema.limits` to include `aiGenerations`

### `apps/backend/src/billing/billing.service.ts`
- Imported `PLAN_DISPLAY_NAMES`
- `getOverview` now counts INITIAL generation runs since start of month (status != FAILED) and returns them in usage/limits
- Added `assertCanGenerate(workspaceId)` — counts monthly INITIAL runs, throws `ForbiddenException` if plan limit exceeded. GROWTH plan skips check (limit = -1)

### `apps/backend/src/generation/generation.module.ts`
- Added `BillingModule` to imports

### `apps/backend/src/generation/generation.service.ts`
- Injected `BillingService`
- `runInitial` calls `assertCanGenerate` before doing anything — edits don't consume credits

### `apps/frontend/app/settings/billing/page.tsx`
- Current plan card now shows AI generations progress bar alongside contacts
- Free/Starter show used/limit; Growth shows ∞

### `apps/frontend/components/shell/Sidebar.tsx`
- `BillingCard` now shows AI generation usage with progress bar
