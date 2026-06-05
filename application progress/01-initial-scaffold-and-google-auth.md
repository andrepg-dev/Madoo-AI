# Madoo AI — Progress Log 01

**Date:** 2026-04-25
**Scope:** Initial monorepo scaffold, frontend design implementation, Google login (popup), prompt-gated auth flow, Prisma schema.

---

## 1. Monorepo & Infra

- Turborepo + pnpm workspaces with two apps:
  - `apps/frontend` — Next.js 15 (App Router) + React 19 + TypeScript
  - `apps/backend`  — NestJS 10 + Prisma 5 + PostgreSQL 16
- `docker-compose.yml` at the repo root provisions Postgres 16-alpine with healthcheck and a named volume `madoo-postgres-data`. Port and credentials come from root `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`).
- `.env.example` files added at root, `apps/frontend`, and `apps/backend`.

## 2. Frontend — Design Implementation

Implemented from the "Mailmint AI.html" design, rebranded to **Madoo AI** with the warm clay theme as default.

- **Stack choice:** inline styles + CSS variables (no Tailwind) to keep pixel parity with the original prototype.
- **Fonts:** Inter, Instrument Serif, JetBrains Mono via `next/font/google`.
- **Theming:** `data-theme="warm"` and `data-density="cozy"` on `<html>`. CSS variables in `app/globals.css` cover default / warm / indigo themes plus animations.
- **Routes (all static):** `/`, `/campaigns`, `/contacts`, `/analytics`, `/domain`.
- **Shell:** `Sidebar`, `TopBar`, `AppShell`.
- **Home flow:** `HomeScreen` (state machine: `home` → `generating` → `editor`) with `Dropdown`, `TemplateCard`, `GeneratingScreen`, `EditorScreen`.
- **Templates:** 12 hand-rendered variants in `components/templates/TemplatePreview.tsx`.
- **Other screens:** `ContactsScreen`, `CampaignsScreen` (+ 5-step `ComposeModal`), `AnalyticsScreen`, `DomainScreen`.
- **Mock data:** `lib/data.ts` (TEMPLATES, SEGMENTS, MOCK_CONTACTS, MOCK_CAMPAIGNS, DRAFT_EMAILS, EMAIL_VARIABLES, helpers `generateSubject`, `altSubject`, `generateBody`).
- **Icons:** typed `components/icons/Icon.tsx` with a centralized path table.

## 3. Backend — NestJS Setup

- API versioning: URI versioning, global prefix `api`, default version `1` → all endpoints live under `/api/v1`.
- Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform`.
- CORS configured from `CORS_ORIGINS` env.
- `@Global() PrismaModule` exporting `PrismaService` (extends `PrismaClient` with `onModuleInit` / `onModuleDestroy`).
- Modules: `AuthModule`, `UsersModule`, `PromptsModule`, plus a `health.controller.ts` exposing `GET /api/v1/health`.

### Prisma Schema

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  googleId      String?   @unique
  emailVerified Boolean   @default(false)
  locale        String?
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  pendingPrompts PendingPrompt[]
  @@index([email])
}

model PendingPrompt {
  id        String   @id @default(cuid())
  userId    String
  prompt    String
  tone      String?
  length    String?
  audience  String?
  consumed  Boolean  @default(false)
  createdAt DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, consumed])
}
```

## 4. Authentication — Google Identity Services (in-page popup)

**Decision:** GIS over OAuth redirect — keeps the user in the flow. ID token is verified backend-side with `google-auth-library`.

### Backend
- `src/auth/dto/google-login.dto.ts` — `idToken` required, optional `pendingPrompt`/`pendingTone`/`pendingLength`/`pendingAudience` (with `MaxLength` constraints).
- `src/auth/google-token.verifier.ts` — wraps `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`. Requires `email_verified=true`. Throws `UnauthorizedException` on failure or missing client id.
- `src/auth/auth.service.ts#loginWithGoogle()`:
  1. Verify Google ID token.
  2. Upsert `User` by `googleId` (email + name + avatarUrl + `lastLoginAt`).
  3. If a `pendingPrompt` was sent, create a `PendingPrompt` row attached to the user.
  4. Sign JWT (`{ sub, email }`) using `JWT_SECRET` / `JWT_EXPIRES_IN`.
  5. Return `{ token, user, pendingPromptId }`.
- `src/auth/jwt-auth.guard.ts` — Bearer token guard, attaches `req.user = { sub, email }`.
- `@CurrentUser()` parameter decorator.
- `src/auth/auth.controller.ts`:
  - `POST /api/v1/auth/google` (public)
  - `GET  /api/v1/auth/me`     (guarded)
- `src/prompts/prompts.controller.ts` (all guarded):
  - `POST /api/v1/prompts/pending`
  - `GET  /api/v1/prompts/pending`
  - `POST /api/v1/prompts/pending/:id/consume`

### Frontend
- `lib/env.ts` — exposes `API_URL` and `GOOGLE_CLIENT_ID` from `NEXT_PUBLIC_*` env.
- `lib/api.ts` — token + pending-prompt localStorage helpers (`madoo.auth.token`, `madoo.pendingPrompt`), `ApiError`, typed `request<T>`, `api.loginWithGoogle()`, `api.me()`.
- `lib/google-gsi.ts` — types and `loadGsiScript()` for `https://accounts.google.com/gsi/client` (deduplicates the `<script>` tag).
- `components/auth/AuthContext.tsx` — `AuthProvider` + `useAuth()`. Tracks `user`, `loading`, `loginOpen`, `pendingPromptForGate`. Exposes `openLogin(pending?)`, `closeLogin()`, `finishLogin(token, user)`, `logout()`. On mount, if a token exists it hydrates `user` via `api.me()`.
- `components/auth/LoginModal.tsx` — modal that loads GSI, calls `initialize()` + `renderButton()` (filled black pill, "continue_with"), and on credential callback hits `api.loginWithGoogle()` with any pending prompt fields. Clears the pending prompt and finishes login. Shows a preview of the pending prompt when the modal is opened from the gate.

### Prompt-Gated Login Flow (the user's hard requirement)

> Login is requested **only** when an unauthenticated user types in the textarea and presses Enter. The message must persist across login.

- `app/layout.tsx` now wraps the app with `<AuthProvider>` and renders `<LoginModal />` at root.
- `components/home/HomeScreen.tsx`:
  - Plain **Enter** submits (Shift+Enter for newline).
  - `handleGenerate()`: if `!user`, save `{ prompt, tone, length, audience }` via `savePendingPrompt()` and call `openLogin(pending)` instead of advancing the screen.
  - On successful login, a `useEffect` watching `user` reads the pending prompt back, restores it into local state, clears it from storage, and auto-starts generation — so the user lands exactly where they left off.

## 5. Verification

- `pnpm --filter @madoo/frontend build` → ✅ all 6 routes statically generated, no type errors.
- `pnpm --filter @madoo/backend build` → ✅ after `prisma generate`.

## 6. What's Next

- **DB migration:** `docker compose up -d` then `pnpm --filter @madoo/backend exec prisma migrate dev --name init`.
- **Env wiring:** set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend) and `GOOGLE_CLIENT_ID` + `JWT_SECRET` (backend).
- **TopBar polish:** render user avatar + logout when authenticated.
- **End-to-end smoke test** with `pnpm dev` once Google client id is in place.
- **Backend dev orchestration:** verify `turbo.json` runs both apps in parallel with the right port assignments (`frontend:3000`, `backend:4000`).

## 7. File Index (new/changed in this pass)

```
docker-compose.yml
.env.example

apps/frontend/.env.example
apps/frontend/next.config.ts
apps/frontend/tsconfig.json
apps/frontend/app/layout.tsx
apps/frontend/app/globals.css
apps/frontend/app/{page,campaigns,contacts,analytics,domain}/page.tsx
apps/frontend/lib/{data,env,api,google-gsi}.ts
apps/frontend/components/icons/Icon.tsx
apps/frontend/components/templates/TemplatePreview.tsx
apps/frontend/components/shell/{Sidebar,TopBar,AppShell}.tsx
apps/frontend/components/home/{HomeScreen,Dropdown,TemplateCard,GeneratingScreen,EditorScreen}.tsx
apps/frontend/components/contacts/ContactsScreen.tsx
apps/frontend/components/campaigns/{CampaignsScreen,ComposeModal}.tsx
apps/frontend/components/analytics/AnalyticsScreen.tsx
apps/frontend/components/domain/DomainScreen.tsx
apps/frontend/components/auth/{AuthContext,LoginModal}.tsx

apps/backend/.env.example
apps/backend/nest-cli.json
apps/backend/tsconfig.json
apps/backend/prisma/schema.prisma
apps/backend/src/main.ts
apps/backend/src/app.module.ts
apps/backend/src/health.controller.ts
apps/backend/src/prisma/{prisma.service,prisma.module}.ts
apps/backend/src/auth/dto/google-login.dto.ts
apps/backend/src/auth/google-token.verifier.ts
apps/backend/src/auth/auth.service.ts
apps/backend/src/auth/jwt-auth.guard.ts
apps/backend/src/auth/current-user.decorator.ts
apps/backend/src/auth/auth.controller.ts
apps/backend/src/auth/auth.module.ts
apps/backend/src/users/dto/user.dto.ts
apps/backend/src/users/users.service.ts
apps/backend/src/users/users.module.ts
apps/backend/src/prompts/dto/create-pending-prompt.dto.ts
apps/backend/src/prompts/prompts.service.ts
apps/backend/src/prompts/prompts.controller.ts
apps/backend/src/prompts/prompts.module.ts
```
