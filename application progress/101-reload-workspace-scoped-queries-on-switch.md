# 101 — Reload workspace-scoped data on workspace switch

Date: 2026-07-07

## Bug
Switching workspaces did not reload templates/projects. The home showcase
(`components/home/project-show-case.tsx`) reads `["emails"]` and
`["community-templates"]` via React Query, but the switch handlers only
invalidated `["billing-overview"]`. With `staleTime: 30s` and no invalidation of
the scoped keys, the previous workspace's cached data stayed on screen.

There were four switch entry points (Sidebar, settings-view effect,
WorkspacePanel delete, CreateWorkspaceModal), none of which cleared the scoped
caches.

## Fix
Centralized, single source of truth instead of patching four handlers:
- `lib/query-keys.ts`: `WORKSPACE_SCOPED_QUERY_KEYS` — the root keys whose data
  is workspace-scoped (emails, email, email-chat, email-rating, templates,
  template-preview, community-templates, community-template, billing-overview,
  workspace-invites, workspace-members).
- `components/providers/QueryProvider.tsx`: `WorkspaceCacheReset` watches
  `useClientStore().workspaceId` and, on an actual switch (prev non-null and
  changed), `removeQueries` for every scoped key. Mounted queries auto-refetch,
  and `setActiveWorkspace` has already written the workspace cookie that
  `FetchWrapper` reads, so refetches hit the new workspace.

Skips the initial `null -> id` login assignment (nothing cached).

## Notes
- Query keys are not workspace-partitioned (e.g. `["emails"]`, not
  `["emails", workspaceId]`); prefix-drop on switch is the pragmatic fix. A fuller
  refactor would embed `workspaceId` in every key.
- Existing per-handler `invalidateQueries(["billing-overview"])` calls are now
  redundant but harmless; left in place.

## Verification
- `tsc --noEmit` clean (client). Not yet runtime-verified in the browser
  (needs two workspaces + auth).
</content>
