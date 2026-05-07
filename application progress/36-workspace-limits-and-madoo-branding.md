# 36 — Workspace Limits & Madoo Branding

## What changed

### `packages/shared/src/billing.ts`
- Added `workspaces: number` to `PlanLimits` type (`-1` = unlimited)
- `FREE`: 1 workspace, `STARTER`: 5 workspaces, `GROWTH`: unlimited

### `apps/backend/src/workspaces/workspaces.service.ts`
- `createForUser` now enforces workspace limit before creating
- Counts owned workspaces, derives best plan across owned workspaces' billing subscriptions
- Throws `ForbiddenException` with upgrade prompt when limit hit
- `ensurePersonalWorkspace` (auto-created on first login) is NOT subject to the limit

### `apps/backend/src/sending/footer.ts`
- `buildComplianceFooter` gains optional `showMadooBranding = false` param
- When `true`, appends `· Sent with Madoo` (linked to madoo.ai) inside the footer `<p>`

### `apps/backend/src/campaigns/campaign-send.processor.ts`
- Campaign query now includes `workspace.billingSubscription.plan`
- Passes `plan === "FREE"` as `showMadooBranding` to `buildComplianceFooter`
- Only FREE plan emails show the Madoo branding; STARTER and GROWTH are clean

### `apps/frontend/app/settings/billing/page.tsx`
- `PLAN_FEATURES` updated: `FREE` → "1 workspace", `STARTER` → "Up to 5 workspaces", `GROWTH` → "Unlimited workspaces"

## Result
- FREE users can only own 1 workspace; creating a second throws a 403 with upgrade message
- STARTER users can own up to 5 workspaces
- GROWTH users have no workspace cap
- FREE plan emails include `· Sent with Madoo` in the compliance footer
- TypeScript passes clean on backend
