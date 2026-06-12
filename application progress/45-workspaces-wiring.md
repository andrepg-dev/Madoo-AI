# 45 — Workspaces, Sidebar, Credits (Phase 2)

Date: 2026-06-11

## Context

Phase 2 finishes workspace management for `apps/client` while keeping `apps/frontend` reference-only. Shared schemas, Prisma `Workspace.avatarUrl`, and the core `WorkspacesService` role-protected methods were already in progress from the handoff; this pass wired the missing controller, client actions, sidebar, credits, and create-workspace flow.

## Shared / Prisma

- `packages/shared/src/workspace.ts`: `WorkspaceSchema.avatarUrl`, `UpdateWorkspaceInputSchema`, `WorkspaceMemberSchema`, `UpdateMemberRoleInputSchema`.
- `packages/shared/dist/workspace.*`: verified current dist already contains those Phase 2 schemas; no new shared edit this pass, so no shared build needed.
- Prisma migration `20260611001000_add_workspace_avatar`: `Workspace.avatarUrl String?`; already applied and Prisma client regenerated before this pass.

## Backend (`apps/backend`)

- `workspaces/dto/workspace.dto.ts`: includes `avatarUrl`; `toWorkspaceMemberDto()` serializes membership rows through shared schema.
- `workspaces.service.ts`: contains role checks and management operations: update workspace, workspace avatar, delete, leave, list members, update member role, remove member.
- New `src/workspaces/workspaces-current.controller.ts`:
  - `PATCH /workspaces/current` — ADMIN+ rename/slug update.
  - `POST /workspaces/current/avatar` — ADMIN+ multipart upload to S3 `workspace-avatars/`.
  - `DELETE /workspaces/current` — OWNER only, service forbids deleting last workspace.
  - `POST /workspaces/current/leave` — member leave, service protects last owner and last workspace.
  - `GET /workspaces/current/members` — current workspace members.
  - `PATCH /workspaces/current/members/:userId` — OWNER role update.
  - `DELETE /workspaces/current/members/:userId` — ADMIN+ remove member, service blocks owner removal.
- `workspaces.module.ts`: registers `WorkspacesCurrentController` and imports `S3Module`.

## Client (`apps/client`)

- New `actions/workspaces.ts` server actions:
  - `fetchWorkspaces`, `createWorkspace`, `setActiveWorkspace`.
  - `updateCurrentWorkspace`, `uploadWorkspaceAvatar`, `deleteCurrentWorkspace`, `leaveCurrentWorkspace`.
  - `fetchWorkspaceMembers`, `updateWorkspaceMemberRole`, `removeWorkspaceMember`.
- New `actions/billing.ts` server actions:
  - `fetchBillingOverview`, `createCheckoutSession`, `createPortalSession`.
- `components/shell/Sidebar.tsx`:
  - `["me"]`, `["workspaces"]`, and `["billing-overview", workspaceId]` TanStack queries.
  - Workspace switcher now uses real workspaces, avatars, roles, active checkmark, and `setActiveWorkspace()` cookie write.
  - First workspace auto-select writes cookie before setting client store to avoid billing requests without `x-workspace-id`.
  - Credits card reads billing overview usage/limit/reset date.
  - User menu reads real user query; sign-out calls `logoutAction()` and routes home.
- `components/shell/CreateWorkspaceModal.tsx`:
  - Creates real workspace, sets it active, updates query cache, invalidates workspace and billing queries.
  - Shows real error toast when workspace limit or backend validation fails.

## Verified

- `pnpm --filter @madoo/backend exec tsc --noEmit` — clean.
- `pnpm --filter @madoo/client exec tsc --noEmit` — clean.
- Backend dev server was already running on `:4000`; client dev server already responding on `:3003`.
- Curl smoke:
  - `POST /api/v1/auth/login` with `smoke-test@example.com / password456` — 200, `madoo_token` cookie set.
  - Cookie-only `GET /api/v1/workspaces/me` — 200.
  - `GET /api/v1/workspaces/current/members` with `x-workspace-id` — 200.
  - `GET /api/v1/billing/overview` with `x-workspace-id` — 200.
  - `PATCH /api/v1/workspaces/current` with same slug — 200.
  - `PATCH /api/v1/workspaces/current/members/:userId` with same OWNER role — 200.
  - `GET http://localhost:3003` — 200.

## Notes

- Did not smoke `DELETE /workspaces/current`, `POST /leave`, or avatar upload because the smoke user has one workspace and S3 upload would write a real object.
- Create workspace action is wired, but smoke user is currently on Free plan with one workspace; create will correctly surface backend workspace-limit errors until upgraded.

## Next

Phase 3 (log 46): email project wiring — backend `GET /emails/:id/chat`, client email actions, SSE proxy routes, project page resume/create/edit streaming.
