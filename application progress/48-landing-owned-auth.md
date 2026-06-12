# 48 - Landing-Owned Auth and Prompt Handoff

Date: 2026-06-11

## Decision

Auth UI and registration now live in `apps/landing`. `apps/client` consumes session cookies only and redirects unauthenticated users back to landing.

## Work

- Added real Google Identity Services login to landing using:
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=1045426416197-caerjkkajfie6j7789fi72trr35pltop.apps.googleusercontent.com`
- Added landing BFF route `apps/landing/app/api/auth/google/route.ts`:
  - forwards Google id token and pending prompt fields to backend
  - sets `madoo.auth.token` and `madoo.workspace.id`
  - returns user/workspace data and `pendingPromptId`
- Removed client login/register modal, client auth provider routes, Google/Apple auth client libs, and modal auth store state.
- Removed product settings password/provider login sections and dead client password/provider actions.
- Client middleware now redirects protected routes to landing with absolute `next`.
- Client prompt submit and sidebar sign-in redirect to landing.
- Landing reads `next`, preloads prompt/dropdown options, opens Google login, then sends user to client.

## Verification

- `./node_modules/.bin/tsc -p apps/landing/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- HTTP smoke on running dev servers:
  - protected client routes redirect to landing with `next`
  - landing returns 200 for `next` URLs
  - landing Google API returns 400 for invalid payload

## Notes

- Did not run build commands per repository instruction.
