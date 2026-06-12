# 44 — Auth: Cookies, Middleware, Multi-Provider Login, Logout (Phase 1)

Date: 2026-06-11

## Context

Backend auth was Google-only, stateless Bearer JWT with no logout. apps/client had no auth at all. This phase delivers cookie-based sessions, route protection, and four login methods: email+password, Google, GitHub, Apple.

## Shared (`packages/shared/src`)

- `auth.ts` rewritten: `RegisterInputSchema`, `PasswordLoginInputSchema`, `GithubLoginInputSchema {code, redirectUri}`, `AppleLoginInputSchema {idToken, name?}`, `ChangePasswordInputSchema`, `UpdateUserMeInputSchema`, `AuthProviderKindSchema`, `ConnectedAccountsResponseSchema`. `AuthSessionResponseSchema` is the canonical login response; `GoogleLoginResponseSchema` kept as alias (apps/frontend untouched).
- `user.ts`: `UserSchema` gains `hasPassword: boolean` (defaulted, back-compatible).

## Backend (`apps/backend`)

- Prisma migration `20260611000000_add_auth_accounts_and_password`: `User.passwordHash`, new `AuthAccount` model (`provider GOOGLE|GITHUB|APPLE`, `providerAccountId`, unique pair), backfill of existing Google users into AuthAccount. Applied via `prisma migrate deploy` — note: `migrate dev` is broken in this repo because the baseline migration (User/Workspace tables) was removed from history, so the shadow DB cannot replay; hand-written SQL + deploy is the working pattern.
- Deps: `bcryptjs`, `cookie-parser`, `jose`, `multer`.
- `src/auth/auth-cookie.ts`: `AUTH_TOKEN_COOKIE = "madoo_token"` (httpOnly, lax, secure in prod).
- `jwt-auth.guard.ts`: accepts Bearer header **or** the cookie.
- `auth.service.ts`: refactored `issueSession()` (workspace ensure + pending prompt + JWT); new `register` (bcrypt 12 rounds), `loginWithPassword` (generic "Invalid credentials."), `loginWithGithub` (code exchange → /user + /user/emails → verified email), `loginWithApple` (jose JWKS verify vs appleid.apple.com, aud = APPLE_CLIENT_ID). OAuth users link by verified email via `AuthAccount` upsert.
- `auth.controller.ts`: `POST /auth/{google,register,login,github,apple}` all set the session cookie AND return the token JSON (the client BFF stores its own first-party cookie); `POST /auth/logout` clears it.
- `src/users/users.controller.ts` (new): `PATCH /users/me` (name), `PATCH /users/me/password` (currentPassword required only when a hash exists — OAuth users can set a first password), `POST /users/me/avatar` (multipart → S3 `avatars/`), `GET /users/me/accounts`.
- `main.ts`: `cookieParser()` registered.
- `.env.example`: documented `GITHUB_CLIENT_ID/SECRET`, `APPLE_CLIENT_ID/TEAM_ID/KEY_ID/PRIVATE_KEY` with where-to-get instructions.

## Client (`apps/client`)

- `actions/auth.ts` ("use server"): `getMe`, `getMeOrNull`, `logoutAction` (backend logout + delete first-party cookies), `updateMe`, `changePassword`, `uploadAvatar`, `fetchConnectedAccounts`.
- `app/api/auth/[provider]/route.ts`: BFF proxy for google/register/login/apple — validates with shared schema, forwards to backend, sets `madoo.auth.token` + `madoo.workspace.id` cookies, returns user/workspaces/defaultWorkspaceId/pendingPromptId.
- `app/api/auth/github/callback/route.ts`: GET callback — exchanges code via backend `/auth/github`, sets cookies, redirects to the path encoded in `state` (same-origin-only).
- `middleware.ts`: guards `/dashboard`, `/settings`, `/email-template-project`; unauthenticated → `/?login=1&next=…`.
- `components/auth/LoginModal.tsx`: Google GSI button, GitHub button (redirect flow), Apple button (popup via AppleID JS — rendered only when `NEXT_PUBLIC_APPLE_CLIENT_ID` set), email+password with login/signup toggle. On success: store user + workspace, navigate to pending prompt project or `next`.
- `components/auth/AuthBootstrap.tsx`: hydrates `["me"]` on load, auto-opens login on `?login=1`.
- `stores/auth-store.ts`, `lib/{google-gsi,apple-auth,storage}.ts`, `lib/env.ts` extended.
- Mounted in `AppProviders` under Suspense.

## Verified

- `POST /auth/register` → 201 + `Set-Cookie: madoo_token=…; HttpOnly; SameSite=Lax`.
- `GET /auth/me` authenticates with cookie only (no header). Logout returns 204 + expired cookie. Wrong password → 401 generic.
- `PATCH /users/me`, `GET /users/me/accounts`, `PATCH /users/me/password` (old password invalidated, new one works).
- Backend + client `tsc --noEmit` clean.

## Pending / notes

- GitHub/Apple flows are implemented but need real credentials (`GITHUB_CLIENT_ID/SECRET`; Apple needs paid account + https return URL — button hidden until configured).
- GitHub `state` carries only the return path; add a nonce cookie if stronger CSRF protection is wanted later.
- Browser-level login flow gets exercised in Phase 8 verification.
