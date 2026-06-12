# 45 - Workspaces, Sidebar, Credits

Date: 2026-06-11

## Client Work

- Added `actions/workspaces.ts` server actions:
  - `fetchWorkspaces`
  - `createWorkspace`
  - `setActiveWorkspace`
  - `updateCurrentWorkspace`
  - `uploadWorkspaceAvatar`
  - `deleteCurrentWorkspace`
  - `leaveCurrentWorkspace`
  - `fetchWorkspaceMembers`
  - `updateWorkspaceMemberRole`
  - `removeWorkspaceMember`
- Added `actions/billing.ts` server actions:
  - `fetchBillingOverview`
  - `createCheckoutSession`
  - `createPortalSession`
- Wired `components/shell/Sidebar.tsx` to real data:
  - `["me"]` query
  - `["workspaces"]` query
  - `["billing-overview", workspaceId]` query
  - workspace switcher with real workspace names, avatars, roles, active state
  - active workspace cookie write through `setActiveWorkspace`
  - credits usage/limit from billing overview
  - real sign-out via `logoutAction`
- Wired `components/shell/CreateWorkspaceModal.tsx`:
  - creates real backend workspace
  - sets new workspace active
  - updates/invalidate TanStack caches
  - surfaces backend validation and plan-limit errors

## Related Backend Work

- Added `apps/backend/src/workspaces/workspaces-current.controller.ts`.
- Registered controller and `S3Module` in `apps/backend/src/workspaces/workspaces.module.ts`.
- Current-workspace endpoints added for update, avatar, delete, leave, members, role update, and member removal.

## Verification

- Backend TypeScript check clean.
- Client TypeScript check clean.
- Curl smoke covered login, workspaces list, current members, billing overview, no-op workspace update, no-op role update, and client root response.

## Notes

- Did not smoke delete/leave/avatar because smoke user had one workspace and avatar upload would write real S3 object.
