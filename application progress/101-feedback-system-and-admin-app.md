# 101 — In-app feedback system + admin panel

Lightweight feedback (1–5 stars + message), distinct from the existing
categorized `SupportTicket`. Captured in the client app, stored in DB, read
through a new standalone admin app.

## Phase 1 — capture + storage (shared → backend → client)

**Shared** (`packages/shared/src/feedback.ts`, exported from `index.ts`)
- `CreateFeedbackInputSchema { rating 1–5, message ≤2000, page?, workspaceId? }`
- `FeedbackSchema` (admin DTO incl. `userEmail`, `userName`), `FeedbackListSchema { items, total }`.
- Rebuilt `@madoo/shared` dist.

**Prisma** — `Feedback` model (`userId`, `userEmail`, `rating Int`, `message`,
`page?`, `workspaceId?`, `createdAt`) + `User.feedback` relation.
Migration: `20260624093020_add_feedback` (applied locally).

**Backend** (`apps/backend/src/feedback/`)
- `POST /v1/feedback` — `JwtAuthGuard`, creates feedback for current user.
- `GET /v1/feedback?page&pageSize` — `JwtAuthGuard` + new `AdminGuard`, paginated.
- `AdminGuard` (`auth/admin.guard.ts`): checks `req.user.email` ∈ `ADMIN_EMAILS`
  env allowlist (comma-separated). Registered `FeedbackModule` in `app.module.ts`.

**Client** (`apps/client`)
- `actions/feedback.ts` — `createFeedback` server action via `FetchWrapper`.
- `stores/feedback-store.ts` — `open` state so settings can trigger the modal.
- `components/feedback/FeedbackWidget.tsx` — floating "Feedback" button (desktop)
  + Modal with star rating + textarea. Mounted in `ClientShell`.
- Settings → Support panel: "Quick feedback → Send feedback" opens the widget
  (covers mobile, where the floating button is hidden).

## Phase 2 — standalone admin app (`apps/admin`)

New minimal Next.js 15 app (port 3005, no Tailwind/design-system, plain CSS).
- Auth: `/login` posts email+password to backend `/auth/login`, stores returned
  token in this app's own httpOnly cookie `madoo.admin.token` (`actions/auth.ts`).
- `/` (server component) lists feedback via `adminFetch` (Bearer from cookie):
  401 → redirect to `/login`; 403 → "not an admin" notice; supports pagination.
- Authorization is enforced backend-side by `AdminGuard` — a non-admin can log in
  but every admin endpoint 403s.

## Config / ops
- `ADMIN_EMAILS` added to `apps/backend/.env` (`asponceg@gmail.com`) and `.env.example`.
- **Prod TODO:** set `ADMIN_EMAILS` on the prod backend env. Migration auto-applies
  on boot (migrate deploy). Decide where to host `apps/admin` + its
  `NEXT_PUBLIC_API_URL`.

## Privacy policy
- `apps/landing` privacy "Support data" bullet replaced with a "Feedback you send
  us" bullet (en + es) to match this system. See #100 for the legal pages.

## Verify
- `tsc --noEmit`: shared, backend, client, admin → all exit 0.
- `next build` (admin) → success.
- Not yet run end-to-end against a live backend.
