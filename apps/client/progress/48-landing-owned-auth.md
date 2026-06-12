# 48 - Landing-Owned Auth and Prompt Handoff

Date: 2026-06-11

## Decision

Auth UI and registration now live in `apps/landing`. `apps/client` consumes session cookies only and redirects unauthenticated users back to landing.

## Landing Work

- Added landing Google Identity Services wiring with the provided client ID:
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=1045426416197-caerjkkajfie6j7789fi72trr35pltop.apps.googleusercontent.com`
- Added `apps/landing/app/api/auth/google/route.ts`:
  - validates a Google id token payload
  - forwards login to backend `POST /auth/google`
  - sets `madoo.auth.token` and `madoo.workspace.id`
  - returns `user`, `workspaces`, `defaultWorkspaceId`, and `pendingPromptId`
- Replaced landing auth placeholder with a real Google login dialog.
- Landing now reads `?next=...`, auto-opens login, and preloads prompt options from the protected client URL when present.
- Successful login redirects:
  - with `pendingPromptId` → `apps/client` `/email-template-project?pendingPromptId=...`
  - without pending prompt → safe client `next` URL or `/dashboard/projects`

## Client Work

- Removed client login/register UI and provider code:
  - `components/auth/LoginModal.tsx`
  - `lib/google-gsi.ts`
  - `lib/apple-auth.ts`
  - client auth provider API route
  - client GitHub callback route
- Simplified client auth store to `user`, `userLoaded`, and `setUser`.
- Removed `?login=1` modal bootstrap behavior.
- Updated client middleware to redirect protected routes to landing with an absolute `next` URL.
- Updated client prompt submit and sidebar sign-in actions to redirect to landing.
- Prompt handoff preserves `prompt`, `tone`, and `length` through the `next` URL.
- Removed obsolete client pending-prompt localStorage helpers.
- Removed product settings password/provider login sections and dead client password/provider actions.

## Env Notes

- `apps/landing/.env.example` now owns `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- `apps/client/.env.example` now contains only API, client URL, and landing URL.
- `apps/backend/.env.example` uses the same Google client ID for server-side token verification and includes `localhost:3001` in CORS examples.

## Verification

- `./node_modules/.bin/tsc -p apps/landing/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- HTTP smoke on running dev servers:
  - protected client routes redirect to landing with `next`
  - landing returns 200 for `next` URLs
  - landing Google API returns 400 for invalid payload

## Notes

- Did not run build commands per repository instruction.
- Backend already accepted pending prompt fields through `issueSession`, so no backend auth logic change was needed for prompt handoff.
