# 43 — apps/client Foundation Wiring (Phase 0)

Date: 2026-06-11

## Context

Kickoff of the full-system wiring effort: `apps/client` (port 3003) is the new work-target UI with zero backend integration. `apps/frontend` (port 3000) stays untouched as the reference implementation; its proven BFF pattern ("use server" actions → `FetchWrapper` reading httpOnly cookie → Bearer + `x-workspace-id`) is being ported into `apps/client`.

Full plan: `/Users/andreponce/.claude/plans/iterative-strolling-curry.md` (phases 0–8, progress logs 43–53).

## Changes

- `apps/client/package.json`: added `@madoo/shared: workspace:*` and `zod ^3.24.1`. `pnpm install` ran clean.
- `apps/client/lib/cookies.ts`: copied from `apps/frontend/lib/cookies.ts` (`madoo.auth.token` httpOnly, `madoo.workspace.id` readable, 1-year max-age, secure in production).
- `apps/client/lib/api/fetch-wrapper.ts`: copied from `apps/frontend/lib/api/fetch-wrapper.ts` — server-side fetcher that injects `Authorization: Bearer` from the auth cookie and `x-workspace-id` (via `WORKSPACE_HEADER` from `@madoo/shared`), throws typed `ApiError`.
- `apps/client/.env.example`: new — documents `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GITHUB_CLIENT_ID`, `NEXT_PUBLIC_APPLE_CLIENT_ID` with where-to-get-it instructions.
- `apps/client/.env.local`: new — reuses the existing Google OAuth client ID from apps/frontend. **Action required: add `http://localhost:3003` to that OAuth client's Authorized JavaScript origins in Google Cloud Console.**
- `apps/backend/.env` + `.env.example`: `CORS_ORIGINS` now includes `http://localhost:3003`; `APP_URL` switched to `http://localhost:3003` (used for Stripe success/cancel URLs and invite links).

## Next

Phase 1 (log 44): auth — cookie support in backend guard, logout endpoint, email+password/GitHub/Apple providers, client LoginModal + middleware.
