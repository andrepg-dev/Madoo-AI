# 129 — Admin panel: Google-only login + Vercel hosting

Date: 2026-07-01

## Goal
Host the internal admin panel (`apps/admin`, the product analytics dashboard)
on Vercel for direct access, restrict sign-in to Google only (remove
email/password), and make `asponceg@gmail.com` an admin.

## Auth model (unchanged backend)
The backend already had everything: `POST /auth/google` verifies a Google ID
token and returns a session, and `AdminGuard` gates every admin endpoint behind
the comma-separated `ADMIN_EMAILS` allowlist. So a non-admin can sign in but
every admin endpoint returns 403 — authorization lives on the backend, the
admin app just carries the token.

## Frontend — `apps/admin` (Google only)
Replaced the email/password form with Google Identity Services (same pattern as
`apps/landing`):
- `lib/env.ts`: added `GOOGLE_CLIENT_ID` (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`,
  defaults to the shared Web client).
- `lib/google-gsi.ts`: copied the GSI loader/types from landing.
- `actions/auth.ts`: dropped `loginAction` (password); added
  `loginWithGoogleAction(idToken)` → `POST /auth/google` → stores the returned
  token in the `madoo.admin.token` httpOnly cookie → redirects to `/`.
- `app/login/login-form.tsx`: renders the Google button, sends the credential
  to the server action.
- `app/login/page.tsx` + `globals.css`: subtitle + button styling.

## Backend — `ADMIN_EMAILS`
- Prod `.env` had **no** `ADMIN_EMAILS` (nobody was an admin). Appended
  `ADMIN_EMAILS=asponceg@gmail.com` on the prod host
  (`/root/Madoo-AI/apps/backend/.env`, backup `.env.bak.admin`) and recreated
  the `madoo-backend` container (`docker compose up -d --no-deps backend`) so it
  picks up the env. Verified `printenv ADMIN_EMAILS` inside the container.
- Local `apps/backend/.env` already had it.

## Vercel — new `madoo-admin` project
- Created project `madoo-admin` (team `asponceg-1722s-projects`), Root Directory
  `apps/admin`, connected to GitHub `andrepg-dev/Madoo-AI` (auto-deploy from
  `main`, same as `madoo-client` / `madoo-ai-frontend`).
- `apps/admin/vercel.json`: monorepo build command
  (`cd ../.. && pnpm --filter @madoo/shared build && pnpm --filter @madoo/admin build`).
- Env vars (Production + Development): `NEXT_PUBLIC_API_URL=https://api.madooai.com/api/v1`,
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<shared web client>`.

## Manual step still required (Google Cloud Console)
Add the admin app's origin (e.g. `https://madoo-admin.vercel.app`, plus any
custom domain) to **Authorized JavaScript origins** for the OAuth Web client
`1045426416197-…apps.googleusercontent.com`, or the Google button errors on the
live site. Server-to-server calls don't need CORS changes.
