# 102 — Fix broken signout + force login when session is gone

## Symptoms
- Signout button did nothing (user stayed logged in).
- When a session was lost/expired, the app kept showing the logged-in UI
  instead of asking the user to log in again.

## Root causes
1. **Signout cookie not cleared.** `logoutAction` (`apps/client/actions/auth.ts`)
   deleted cookies by name only (`jar.delete(AUTH_COOKIE)`). The cookies are set
   with `domain: .madooai.com` + `path: /` (prod), so a name-only delete emits a
   `Set-Cookie` without the domain and the browser keeps the original — session
   survived. `router.push("/")` was also a soft nav that didn't re-trigger the
   auth redirect.
2. **No "no session" redirect.** `AuthBootstrap` runs the `["me"]` query app-wide;
   on `null` (no session) it only called `posthog.reset()`. Meanwhile the Sidebar
   used `user = queriedUser ?? authUser`, falling back to the stale store user, so
   the UI stayed "logged in" and nothing sent the visitor to login.

## Fix
- `apps/client/actions/auth.ts` — delete both cookies with the matching
  `{ path: "/", domain: COOKIE_DOMAIN }` so the browser actually drops them.
- `apps/client/components/shell/Sidebar.tsx` — signout `onSuccess` now does a hard
  `window.location.assign("/")` so middleware re-runs with cleared cookies and
  redirects to the landing login. Removed the now-unused `useRouter`/`router`.
- `apps/client/components/auth/AuthBootstrap.tsx` — when the session resolves to
  `null`, clear workspace + reset PostHog and `window.location.assign("/")` to
  enter the login flow, skipping public routes (`/invite`, `/share`, mirroring the
  middleware allowlist). Covers signed-out, expired, and revoked sessions on every
  page (it is mounted app-wide in `AppProviders`).

The client middleware already redirects unauthenticated navigations to the
landing login; these changes make in-app/mid-session loss behave the same.

## Verify
`npx tsc --noEmit` in `apps/client` passes.
