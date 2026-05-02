---
date: 2026-05-02
area: phase 2 / contacts UX + workspaces creation
files:
  - packages/shared/src/workspace.ts
  - apps/backend/src/workspaces/dto/create-workspace.dto.ts
  - apps/backend/src/workspaces/workspaces.controller.ts
  - apps/backend/src/workspaces/workspaces.service.ts
  - apps/frontend/actions/contacts.ts
  - apps/frontend/actions/workspaces.client.ts
  - apps/frontend/components/contacts/ContactsScreen.tsx
  - apps/frontend/components/shell/TopBar.tsx
---

# 27 — Fix: Add Contact button + workspace switcher and creation

## Problems addressed

- `Add contact` button on `/contacts` had no handler.
- There was no UI to create or switch workspaces.

## Backend changes

- Added shared contract:
  - `CreateWorkspaceInputSchema` in `packages/shared/src/workspace.ts`.
- Added backend endpoint:
  - `POST /workspaces` (auth required) → creates workspace + `OWNER` membership for current user.
- Added service method:
  - `WorkspacesService.createForUser(userId, name)` with slug uniqueness.
- Added input DTO:
  - `CreateWorkspaceDto` with `name` validation.

## Frontend changes

- Added `contactsApi.create(input)` in `actions/contacts.ts` (zod validated, uses `fetcher`).
- Added `actions/workspaces.client.ts` with `workspacesApi` (`list`, `create`) and `workspacesKeys`.
  - Kept the existing `actions/workspaces.ts` server action untouched to avoid scope creep.

### `ContactsScreen`
- Wired `Add contact` button to open a new modal:
  - Email (required), first name, last name fields.
  - Calls `contactsApi.create(...)` and invalidates contacts list on success.

### `TopBar`
- User avatar dropdown now shows:
  - List of current user workspaces from `GET /workspaces/me`.
  - Active workspace highlighted (read from `madoo.workspace.id` cookie).
  - Click switches workspace → updates cookie + reloads.
  - "Add workspace" entry opens a Create Workspace modal.
- Create Workspace modal:
  - Name input + create button → `POST /workspaces`.
  - On success: writes new workspace id to cookie, invalidates workspaces list, reloads.

## Verification

- `pnpm --filter @madoo/backend build` passes.
- `pnpm --filter @madoo/frontend build` passes.
- Existing dev server (Nest watch + Next.js) picks up changes without manual restart.
