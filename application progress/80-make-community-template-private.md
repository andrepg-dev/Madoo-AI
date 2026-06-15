# 80 - Make community template private again

## Goal

Let the author of a community template un-publish it ("make private
again"), reversing the share-to-community action from #79. Removing it
takes the template out of the public gallery without touching the
author's original email in their workspace.

## Shared

- Added `owned: boolean` (default `false`) to `CommunityTemplateDtoSchema`.
  Signals that the requesting user authored the template, so only they
  see the "Make private" action. Backward compatible via the default.

## Backend

- `CommunityTemplatesService`
  - `CommunityTemplateRow` now carries `authorUserId`; public row type
    omits it.
  - `toDto(row, viewerUserId)` computes `owned = viewerUserId !== null &&
    row.authorUserId === viewerUserId`. All callers updated (`list`,
    `get`, `share`, `setStarred` pass the user id; `toPublicDto` passes
    `null`, so public/landing payloads keep `owned` false and still omit
    it).
  - New `makePrivate(id, userId)`: 404 if missing, `ForbiddenException`
    if the caller is not the author, otherwise deletes the
    `CommunityTemplate` row (stars cascade). The source email is left
    untouched.
- `CommunityTemplatesController`: `DELETE /community-templates/:id`
  (`@HttpCode(204)`) → `makePrivate`.
- No migration: `authorUserId` already exists; `owned` is computed, not
  persisted.

## Frontend

- `actions/community-templates.ts`: added `makeCommunityTemplatePrivate(id)`
  (DELETE, returns void).
- `project-show-case.tsx`
  - `makePrivateMutation` invalidates `["community-templates"]` and toasts.
  - Community cards render a `CommunityCardMenu` (lock icon → "Make
    private") only when `template.owned`.
  - `MakePrivateModal` confirmation explains the template leaves the
    gallery and loses stars, while the original email stays private and
    can be re-shared.

## Verification

- `pnpm --filter @madoo/shared build` passed.
- `pnpm --filter @madoo/backend exec tsc --noEmit --incremental false -p tsconfig.json` passed.
- `pnpm --filter @madoo/client exec tsc --noEmit --incremental false -p tsconfig.json` passed.

## Follow-up

- Visual E2E in the running app not performed this session.
