# Madoo-AI: Wire `apps/client` to a Fully Working System

## Context

`apps/client` (Next.js, port 3003) is a complete UI prototype with **zero backend wiring** — every button is dead or a "ready for backend wiring" toast. The NestJS backend (`apps/backend`, port 4000, base `http://localhost:4000/api/v1`) has a solid core (Google→JWT auth, workspaces, AI SSE email generation with persisted chat, templates, Stripe billing) but lacks: logout/cookies, user-settings endpoints, workspace management/invites, all export endpoints, gmail/outlook integration. `apps/frontend` is **reference only** — its BFF pattern is proven and gets copied: `"use server"` actions → `FetchWrapper` (`apps/frontend/lib/api/fetch-wrapper.ts`) reading httpOnly cookie `madoo.auth.token` + `madoo.workspace.id` → Bearer + `x-workspace-id`; SSE proxied through Next route handlers (`apps/frontend/app/api/emails/[id]/generate/route.ts`).

Conventions (`docs/CONVENTIONS.md`, mandatory): every feature = zod schema in `packages/shared/src` + NestJS controller/service with `@UseGuards(JwtAuthGuard, WorkspaceGuard)` + DTO serializers + frontend actions file (pure async fns, zod-parsed) consumed via inline TanStack Query hooks. Every phase logged as numbered md in `apps/client/progress/` and mirrored to `application progress/` when useful (next: 53).

## Current status

- Phase 0-4 wiring is complete at code level through progress logs `45`-`51`.
- Phase 5 billing drawer is complete at code level in `52-billing-pricing-drawer.md`.
- Phase 6 is next: replace static `/settings` UI with real profile, sound, workspace, members, invites, and support workflows.
- Existing Phase 6-ready client actions: `actions/auth.ts` has `getMe`, `updateMe`, `uploadAvatar`; `actions/workspaces.ts` has workspace update/avatar/delete/leave/member role/remove endpoints.
- Existing backend support for Phase 6 partials: `UsersController` handles profile/avatar; `WorkspacesCurrentController` handles workspace overview/avatar/danger/members.
- Missing backend support for Phase 6: support tickets, Resend mail wrapper, invite model/routes, invite preview/accept endpoints.

**User decisions (locked):**

- Cookie-based auth + Next middleware (httpOnly; backend also sets cookie + logout endpoint).
- 2026-06-11 auth ownership update: login/registration UI lives in `apps/landing`; `apps/client` has no login/register modal or provider routes. `apps/client` redirects unauthenticated users to landing with `next`, and landing passes user session cookies plus pending prompt/dropdown options back to client.
- Current landing login provider: Google via `NEXT_PUBLIC_GOOGLE_CLIENT_ID=1045426416197-caerjkkajfie6j7789fi72trr35pltop.apps.googleusercontent.com`. Backend `GOOGLE_CLIENT_ID` must match for token verification.
- Gmail/Outlook export: real OAuth drafts (gmail.compose scope / Microsoft Graph Mail.ReadWrite), tokens stored encrypted.
- ESP cards (Mailchimp, Klaviyo, HubSpot, Brevo, MailerLite, ConvertKit, ActiveCampaign, Customer.io, Braze, Marketo, Salesforce): downloadable ESP-ready HTML with platform-correct merge tags + paste instructions — no ESP APIs.
- File exports: HTML (CSS inlined via `juice`), PNG/JPEG + PDF (existing Puppeteer), AMPHTML = "coming soon" (501).
- Team invite: link token; email too when `RESEND_API_KEY` set.

## Phase 0 — Client plumbing foundation

- `apps/client/package.json`: add `zod`, `@madoo/shared: workspace:*`; `pnpm install`.
- Copy verbatim from apps/frontend: `lib/cookies.ts` (AUTH_COOKIE `madoo.auth.token`, WORKSPACE_COOKIE `madoo.workspace.id` + options), `lib/api/fetch-wrapper.ts`.
- Create `apps/client/.env.example` + `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`, `NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3003`, `NEXT_PUBLIC_LANDING_URL=http://localhost:3001`.
- Create `apps/landing/.env.example` + `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`, `NEXT_PUBLIC_CLIENT_APP_URL=http://localhost:3003`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID=1045426416197-caerjkkajfie6j7789fi72trr35pltop.apps.googleusercontent.com`.
- Backend `.env.example`: `CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3003`; `APP_URL=http://localhost:3003`; `GOOGLE_CLIENT_ID` matches landing.
- Log: `application progress/43-client-foundation-wiring.md`.

## Phase 1 — Auth: landing Google, cookies, middleware, logout

**Shared** (`packages/shared/src/auth.ts`): keep `GoogleLoginInputSchema`, `AuthSessionResponseSchema`, `UpdateUserMeInputSchema`, and user/session DTOs used by landing/client. Historical password/GitHub/Apple schemas can remain for backend/back-compat, but `apps/client` does not expose those login/register surfaces.

**Prisma migration** `add_auth_accounts_and_password`: `User.passwordHash String?`; new model `AuthAccount {provider AuthProviderKind (GOOGLE|GITHUB|APPLE), providerAccountId, @@unique([provider, providerAccountId])}`; backfill SQL from `User.googleId` (keep googleId for apps/frontend back-compat).

**Backend** (`apps/backend/src/auth/`): deps `bcryptjs`, `cookie-parser`, `jose`.

- `main.ts`: `app.use(cookieParser())`.
- New `src/auth/auth-cookie.ts`: `AUTH_TOKEN_COOKIE = "madoo_token"`, options `{httpOnly, sameSite: "lax", secure: prod, path: "/"}`.
- `jwt-auth.guard.ts`: accept Bearer header OR cookie.
- `auth.service.ts`: `loginWithGoogle` issues session and accepts pending prompt fields; older email/password/GitHub/Apple backend support is not exposed in `apps/client`.
- `auth.controller.ts`: Google login and logout set/clear cookies and return session JSON.
- New `src/users/users.controller.ts`: `PATCH /users/me` (name), `POST /users/me/avatar` (FileInterceptor → S3 `avatars/`).
- Backend `.env.example` adds (with where-to-get comments): `GITHUB_CLIENT_ID/SECRET`, `APPLE_CLIENT_ID/TEAM_ID/KEY_ID/PRIVATE_KEY`.

**Client / Landing split**:

- `apps/landing`: owns Google login UI and `app/api/auth/google/route.ts`; route sets shared auth/workspace cookies and returns user/workspace data.
- `apps/landing`: reads `next` URL from client middleware, preserves pending prompt options, and redirects to client after login.
- `apps/client/actions/auth.ts`: session/user/logout/settings actions only; no login/register actions.
- `apps/client/middleware.ts`: guard `/dashboard/:path*`, `/settings`, `/email-template-project`; no auth cookie → redirect to landing with absolute `next`; allow `/invite/:token`.
- Auth state in client store: `user`, `userLoaded`, `setUser`.

**Risks**: localhost cookies are shared across ports so landing-set cookies are visible to client. Production split subdomains need a shared cookie domain.

## Phase 2 — Workspaces, sidebar, credits

**Shared**: `WorkspaceSchema` + `avatarUrl`; `UpdateWorkspaceInputSchema {name?, slug?}`; `WorkspaceMemberDtoSchema`.
**Prisma**: `Workspace.avatarUrl String?`.
**Backend** new `workspaces-current.controller.ts` (path `workspaces/current`, JwtAuthGuard+WorkspaceGuard): PATCH (rename/slug, ADMIN+), POST `/avatar` (S3), DELETE (OWNER, forbid last workspace), POST `/leave` (forbid last OWNER), GET `/members`, PATCH+DELETE `/members/:userId` (role mgmt, protect last OWNER). Add `assertRole` helper in service.
**Client**: `actions/workspaces.ts` (port + new endpoints; `setActiveWorkspace` writes WORKSPACE_COOKIE). Wire `components/shell/Sidebar.tsx` (workspace switcher ← `["workspaces"]` query; credits bar ← `["billing-overview"]`; sign-out → logoutAction; user menu ← getMe) and `CreateWorkspaceModal.tsx`.

## Phase 3 — Email project: create → SSE generate → chat resume

**Shared**: `EmailChatMessageDtoSchema {id, role USER|ASSISTANT|SYSTEM, kind TEXT|THINKING|STATUS, content, createdAt}`.
**Backend**: `GET /emails/:id/chat` (messages ordered by createdAt) — chat is already persisted per-email in `EmailChatMessage`; no new model needed.
**Client**:

- `actions/emails.ts`: port frontend (createEmail, fetchEmail, fetchEmails, deleteEmail, saveEmailTemplate, updateEmailVariantVariableSchema, createEmailFromTemplate) + `fetchEmailChat`.
- `lib/email-stream.ts`: port `consumeEmailSseStream` + event union from `apps/frontend/hooks/use-emails.ts`.
- SSE proxy routes copied from frontend: `app/api/emails/[id]/generate/route.ts`, `.../edit/route.ts` (cookie→Bearer, stream upstream.body).
- Rework `app/email-template-project/page.tsx` (split into `components/project/{ChatPanel,PreviewPanel,ExportProviderModal}.tsx`). URL contract: `?id=<emailId>` resume (fetchEmail + fetchEmailChat + latest variant `compiledHtml` in preview iframe `srcDoc`) or `?prompt=&tone=&length=` new (createEmail → router.replace(?id=) → stream generate). Chat input → stream `/edit` with `{instruction}`; map thinking/status/text/done/error to bubbles (Streamdown renders assistant text); on done refetch email.
- `ClientPromptBox.tsx`: unauthenticated submit → landing auth redirect with prompt/dropdown options preserved in `next`.

## Phase 4 — Projects list, template showcase, search

- `actions/templates.ts`: port (fetchTemplates, previewSeedTemplate, saveTemplateFromVariant).
- `dashboard/projects/page.tsx`: real `fetchEmails` list, client-side sort (updatedAt/title) + status filter, card → `?id=`, delete mutation. Starred/shared sub-pages: honest empty states (no backend — future work).
- `ProjectShowCase.tsx`/`template-card.tsx`: "My emails" = fetchEmails (variant previewUrl PNG); "Madoo templates" = fetchTemplates (12 seeds); click → preview / `POST /emails/from-template` → project page.
- `SearchCommandModal.tsx`: recents = top emails by updatedAt from cached query, fuzzy filter.

## Phase 5 — Billing

**Mapping decision: align UI and backend plan names.** PricingDrawer's hardcoded Basic/Medium/Pro pricing now maps to shared billing constants: Free / Basic / Medium / Pro. Stripe price env names remain `STRIPE_PRICE_BASIC*`, `STRIPE_PRICE_MEDIUM*`, and `STRIPE_PRICE_PRO*`.

- `actions/billing.ts`: port (fetchBillingOverview, createCheckoutSession, createPortalSession).
- `PricingDrawer.tsx`: yearly toggle → `interval: "ANNUAL"`; CTA → checkout URL redirect; current-plan state; manage → portal.
- Verify `APP_URL` used for success/cancel URLs in `billing.service.ts` points to :3003.

## Phase 6 — Settings + support + invites

Goal: turn `apps/client/app/(root-layout)/settings/page.tsx` from static placeholder UI into production wiring. Keep login, registration, provider connection, and password flows out of `apps/client`; landing owns auth.

### 6A — Shared contracts

- Add `packages/shared/src/support.ts`:
  - `SupportCategorySchema`: `ACCOUNT | WORKSPACE | BILLING | GENERATION | EXPORT | OTHER`.
  - `CreateSupportTicketInputSchema`: `contactEmail`, `category`, `subject`, `message`, optional `workspaceId`, optional `emailId`.
  - `SupportTicketSchema`: id, workspaceId, userId, contactEmail, category, subject, message, status, createdAt.
- Add `packages/shared/src/invites.ts`:
  - `CreateWorkspaceInviteInputSchema`: optional `email`, `role` (`ADMIN | MEMBER` only; no `OWNER` invites).
  - `WorkspaceInviteSchema`: id, email, role, token, inviteUrl, expiresAt, invitedBy, acceptedAt, createdAt.
  - `WorkspaceInvitePreviewSchema`: workspace name/avatar/slug, inviter name/email, role, expiresAt, acceptedAt.
  - `AcceptWorkspaceInviteResponseSchema`: workspace + membership/current role.
- Export both files from `packages/shared/src/index.ts`.

### 6B — Prisma + backend support mail

- Add Prisma models:
  - `SupportTicket { id, workspaceId?, userId, contactEmail, category, subject, message, status default OPEN, createdAt, updatedAt }`.
  - `WorkspaceInvite { id, workspaceId, email?, role, token @unique, invitedByUserId, expiresAt, acceptedByUserId?, acceptedAt?, createdAt }`.
  - Add relations to `User` and `Workspace`.
- Add migration `20260611xxxx_add_support_tickets_and_workspace_invites`.
- Install backend dependency `resend` only if implementation starts; do not run build commands unless explicitly asked.
- Add `apps/backend/src/mail/mail.module.ts` + `mail.service.ts`:
  - Reads `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `SUPPORT_EMAIL_TO`.
  - `sendSupportTicket(ticket)` and `sendWorkspaceInvite(invite, inviteUrl)`.
  - If key/email env is missing, log warning and no-op; API still persists rows and returns success.
- Update `apps/backend/.env.example` with:
  - `RESEND_API_KEY=`
  - `RESEND_FROM_EMAIL=`
  - `SUPPORT_EMAIL_TO=`

### 6C — Backend routes

- Add `apps/backend/src/support/`:
  - `SupportModule`, `SupportController`, `SupportService`.
  - `POST /support/contact` guarded by `JwtAuthGuard`; workspace context optional from `x-workspace-id` if present and user belongs to workspace.
  - Validate with shared schema, persist `SupportTicket`, call mail service.
- Extend workspace invites:
  - `POST /workspaces/current/invites` guarded by `JwtAuthGuard + WorkspaceGuard`; `ADMIN+`.
  - `GET /workspaces/current/invites` guarded by `JwtAuthGuard + WorkspaceGuard`; `ADMIN+`.
  - `DELETE /workspaces/current/invites/:inviteId` guarded by `JwtAuthGuard + WorkspaceGuard`; `ADMIN+`; only pending invites.
  - Token generation: `randomBytes(32).toString("base64url")`.
  - Invite link: `${APP_URL}/invite/${token}`.
  - Email invite when Resend configured; link-only invite when not configured.
- Add public invite endpoints:
  - `GET /invites/:token`: preview, no guard; 404 invalid, 410 expired or already accepted.
  - `POST /invites/:token/accept`: `JwtAuthGuard`; creates membership if not member, idempotent if already member, sets accepted fields.
- Edge rules:
  - Prevent inviting existing workspace members.
  - Prevent duplicate pending invite for same email/workspace.
  - Expire invites at 7 days.
  - Reject `OWNER` role in invite input.
  - Accepting user email should match invite email when invite email is set.

### 6D — Client actions

- Add `apps/client/actions/support.ts`:
  - `createSupportTicket(input)` -> `POST /support/contact`, parse `SupportTicketSchema`.
- Extend `apps/client/actions/workspaces.ts`:
  - `createWorkspaceInvite(input)`.
  - `fetchWorkspaceInvites()`.
  - `deleteWorkspaceInvite(inviteId)`.
- Add `apps/client/actions/invites.ts`:
  - `fetchInvitePreview(token)`.
  - `acceptInvite(token)`.

### 6E — Client settings page wiring

- Refactor `settings/page.tsx` into small local panels or `components/settings/*` once it gets unwieldy.
- Account/profile:
  - Query `["me"]` via `getMe`.
  - Save name with `updateMe`.
  - Upload avatar with `uploadAvatar(FormData)`.
  - Email stays read-only.
- Sound:
  - Persist `madoo.sound.pref` in localStorage.
  - Values: `soft`, `bright`, `silent`; include enabled toggle.
  - Update generation-complete path in email project to read preference and play only when not silent.
- Workspace overview:
  - Query active workspace from `["workspaces"]` + active cookie/client selection.
  - Rename/slug via `updateCurrentWorkspace`.
  - Upload workspace avatar via `uploadWorkspaceAvatar`.
- Members and invites:
  - Query `fetchWorkspaceMembers` and `fetchWorkspaceInvites`.
  - Role dropdown for ADMIN/OWNER acting on members; use `updateWorkspaceMemberRole`.
  - Remove non-owner members with confirmation.
  - Invite form: email optional, role ADMIN/MEMBER, show copyable invite link after create.
  - Pending invite list with copy link/delete.
- Danger zone:
  - Delete requires typing active workspace slug; calls `deleteCurrentWorkspace`, clears active workspace cookie or switches to another workspace.
  - Leave calls `leaveCurrentWorkspace`, then switches to remaining workspace.
  - Surface backend "only workspace" / "only owner" errors.
- Support:
  - Category select, subject, message, contact email default from `getMe`.
  - Submit via `createSupportTicket`, optimistic disabled/loading state, success ticket id.
  - Help center button should be a real external/internal link or removed if no route exists.

### 6F — Invite accept page

- Add `apps/client/app/invite/[token]/page.tsx`:
  - Public preview state from `fetchInvitePreview`.
  - If unauthenticated, redirect to landing with `next=/invite/<token>`.
  - If authenticated, accept button calls `acceptInvite`, sets active workspace cookie, routes to `/dashboard/projects`.
  - Show expired/already accepted states from backend status codes.
- Confirm middleware continues to allow `/invite/:token`.

### 6G — Verification

- Type checks only when explicitly requested by user; no build commands.
- Suggested focused checks after implementation:
  - `./node_modules/.bin/tsc -p packages/shared/tsconfig.json --noEmit`
  - `./node_modules/.bin/tsc -p apps/backend/tsconfig.json --noEmit`
  - `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- Runtime smoke when dev servers are already running:
  - Update user name and avatar from settings.
  - Rename workspace and upload workspace avatar.
  - Create invite, copy link, preview public invite, accept as second user.
  - Change member role and remove member.
  - Leave/delete workspace guard errors.
  - Submit support ticket with Resend unset and verify persistence/no-op mail.
- Progress log after work: `apps/client/progress/53-settings-support-invites.md`.

## Phase 7 — Exports

**7A Files** — backend `src/exports/` module (guards + workspace ownership checks):

- `GET /emails/:id/export/html?variantId=` → compiledHtml → `juice` (new dep) → attachment.
- `GET /emails/:id/export/image?variantId=&format=png|jpeg` → extend `ScreenshotService.screenshotHtml` to accept type/quality.
- `GET /emails/:id/export/pdf` → add `pdfFromHtml` to ScreenshotService (`page.pdf({format:"A4", printBackground:true})`).
- AMPHTML → 501; UI card "Coming soon".
- Client: auth'd downloads via Next proxy `app/api/export/[...path]/route.ts` (cookie→Bearer, stream); cards open anchor to proxy URL.

**7B ESP** — backend `src/exports/esp-merge-tags.ts`: 11 provider tag formatters (Mailchimp `*|NAME|*`, Klaviyo `{{ name }}`, HubSpot `{{ contact.x }}`, Brevo `{{ contact.X }}`, MailerLite `{$x}`, ConvertKit `{{ subscriber.x }}`, ActiveCampaign `%X%`, Customer.io `{{ customer.x }}`, Braze `{{${x}}}`, Marketo `{{lead.X}}`, Salesforce `%%x%%`). `GET /emails/:id/export/esp?provider=` → build props: dynamic vars = provider tag, static keep defaults → **reuse `ReactToHtmlService.renderComponent(componentCode, props)`** → juice → download. Zapier/Make/n8n/Webhook/Google Cloud cards: `GET /emails/:id/export/payload` → JSON `{subject, html, variables}` download. Per-provider paste instructions client-side in `apps/client/lib/export-instructions.ts`.

**7C Gmail/Outlook OAuth drafts** — Prisma `ProviderConnection {userId, provider GMAIL|OUTLOOK, accessTokenEnc, refreshTokenEnc?, expiresAt, accountEmail, @@unique([userId, provider])}`. Add `decryptSecret` to `src/common/crypto.ts` (only `encryptSecret` exists today); dedicated `TOKEN_ENCRYPTION_KEY` env (openssl rand -base64 32). Backend `src/connections/` module: `GET /connections`, `GET /connections/:provider/authorize-url` (Gmail scope `gmail.compose`, `access_type=offline&prompt=consent`; Outlook `login.microsoftonline.com/common/oauth2/v2.0`, scope `offline_access Mail.ReadWrite`), `POST /connections/:provider/exchange {code}`, `DELETE /connections/:provider`. Export: `POST /emails/:id/export/gmail-draft` (RFC822 MIME base64url → gmail.googleapis.com drafts API; auto-refresh token) and `POST /emails/:id/export/outlook-draft` (Graph `POST /me/messages` HTML body). Return `{ok, openUrl}` (mail.google.com drafts / outlook.office.com drafts; Outlook App + Web cards share Graph draft). Client: `actions/connections.ts` + popup callback `app/api/connections/[provider]/callback/route.ts`; modal cards: connect popup → create draft → toast with open link. Env: reuse `GOOGLE_CLIENT_ID`/`GOOGLE_SECRET_ID` (note nonstandard name; enable Gmail API + add redirect URI), new `MS_CLIENT_ID/MS_CLIENT_SECRET/MS_TENANT=common` (portal.azure.com → App registrations). Risk: gmail.compose is a restricted scope — unverified-app warning in dev, add test users; token refresh failure → "reconnect" state.

## Phase 8 — Testing (email QA suite)

Goal: add a **Testing** surface to the email project page (`apps/client/app/email-template-project`). Lives in the preview/render sidebar next to **Export** — same header pill style/placement. Clicking opens a `Modal` titled **"Testing Email Message"** with a 5-tab segmented control: **Your Inbox · Email Clients · Accessibility · Links · Spam**. Each tab scoped to the active email + latest variant (same `emailId`/`variantId` contract as `ExportProviderModal`).

Build order: **8A Accessibility** (real, Axe-core) and **8B Email Clients** (preview matrix) first; **8C Your Inbox** (send test); **Links** + **Spam** ship as **"Soon"** stubs.

### Reference UI (captured from screenshots)

- **Modal shell** — centered card, title "Testing Email Message", pill tab bar (active tab = white pill on grey track), close X top-right.
- **Accessibility tab** (active state): heading "Accessibility Check", subtext "Conducted with Axe-core", body "Run an email accessibility check to discover compliance issues and manage fixes.", green **"Run a Test"** button (clipboard-check icon).
- **Links tab**: heading "Links Testing" + green **"Soon"** badge, body "Scan URLs to detect broken links, missing UTMs, and inconsistent campaign names. Be sure everything loads properly on all devices.", green "Like it" button (vote-for-feature). Spam tab mirrors this "Soon" pattern.
- **Accessibility Checker results panel** (after Run a Test) — card titled "Accessibility Checker" with refresh icon; segmented summary **Failed [n] · Passed [n] · Ignored [n]**; results grouped by severity (**Critical**, **Serious**, **Moderate**, **Minor**) each with a count; each finding = card with severity icon (red ✕ critical / amber △ serious), rule title, description, and a "?" help link. Examples seen: "Image must have alternative text" (Critical), "Enhance contrast ratio of colors", "Documents must have `<title>` element", "`<html>` element must have a `lang` attribute", "Content inside the body should be wrapped in a landmark" (Serious). Carousel dots paginate findings within a severity group.

### 8A — Accessibility (Axe-core, real)

- **Approach**: run `axe-core` against the variant's `compiledHtml`. Run client-side in a hidden/offscreen iframe (load `srcDoc = compiledHtml`, then `axe.run(iframe.contentDocument)`). This avoids a backend Puppeteer dependency; if iframe sandboxing blocks axe, fall back to a backend `POST /emails/:id/test/accessibility` that runs axe in the existing Puppeteer page (`generation/screenshot.service` browser) and returns the violations JSON.
- **Client**: `apps/client/package.json` add `axe-core`. New `lib/accessibility.ts` → `runAxe(html): Promise<AxeResult>` mapping axe output to `{ failed, passed, ignored, violationsBySeverity }`. New `components/project/testing/AccessibilityPanel.tsx` rendering the summary tabs + severity-grouped cards (impact → Critical/Serious/Moderate/Minor). Help "?" links to the axe rule `helpUrl`.
- **Shared** (only if backend fallback used): `packages/shared/src/testing.ts` → `AxeViolationSchema`, `AccessibilityResultSchema {failed,passed,ignored,violations[]}`.
- No persistence required for v1 (results are ephemeral, re-run on demand). "Ignored" starts at 0; optional later: let user mark a rule ignored (localStorage `madoo.a11y.ignored`).

### 8B — Email Clients (preview matrix)

- Preview how the email renders across major clients/devices. v1 = **client-side simulated viewports** (no third-party rendering service): a grid/list of targets — Gmail (web/iOS/Android), Apple Mail (macOS/iOS), Outlook (Windows/web/iOS), Yahoo, etc. — each rendering `compiledHtml` in an iframe at that client's known width + a wrapper note for major quirks (e.g. Outlook desktop = no media queries, fixed width). Desktop/mobile toggle reuses existing preview width logic.
- Honest scope note: true client-accurate rendering needs a paid service (Litmus/Email on Acid API). v1 ships viewport-accurate previews; flag "render-accurate testing" as future work. Decision needed before wiring a paid provider.

### 8C — Your Inbox (send test)

- "Send a test email to yourself" → uses the variant `compiledHtml`. Backend `POST /emails/:id/test/send {to?}` (default `to` = current user email) via the existing **Resend** `MailService` (`sendTestEmail`); no-op + warning when `RESEND_API_KEY` unset (mirror support/invite behavior). Form: recipient (prefill from `getMe`), send button, success/queued toast.

### Links + Spam — "Soon" stubs

- Static panels matching the screenshots: heading + green "Soon" badge + description + "Like it" feature-vote button (button can post to `createSupportTicket` with category `OTHER` as an interest signal, or be a no-op for v1 — decide).
- Links (future): scan `href`s for broken links, missing UTM params, inconsistent campaign names. Spam (future): SpamAssassin-style score.

### Wiring + files

- `components/project/testing/TestingModal.tsx` (tab shell) + per-tab panels under `components/project/testing/`.
- Add a **Test** header pill next to Export in `EmailPreviewSidebar`; `email-template-project/page.tsx` holds `testingModalOpen` state and passes `emailId`/`variantId` like the export modal.
- Backend (if used): `src/testing/` module (`@UseGuards(JwtAuthGuard, WorkspaceGuard)`) for `/emails/:id/test/*`, reusing `ScreenshotService` browser + `MailService`.

### Verification

- Run a Test on a ready email → Axe summary counts + severity cards render; "?" opens axe docs. Email Clients tab shows multi-viewport previews. Send test lands in inbox when Resend configured; no-op otherwise. Links/Spam show "Soon".
- Progress log: `apps/client/progress/58-testing-accessibility-clients.md`.

## Key reuse

- `apps/frontend/lib/api/fetch-wrapper.ts`, `actions/*.ts`, `hooks/use-emails.ts` SSE consumer, `app/api/emails/[id]/*/route.ts` proxies, `stores/auth.ts` — copy/adapt into client where still relevant.
- Backend: `ReactToHtmlService.renderComponent` (ESP merge tags), `ScreenshotService` (image/PDF), `S3Service.uploadBuffer` (avatars), `issueSession` refactor, existing Stripe + billing overview.

## Verification

1. `docker compose -f apps/backend/docker-compose.yaml up -d`; `pnpm --filter @madoo/backend prisma:migrate`; backend dev (:4000); client dev (:3003).
2. Auth: landing Google login → cookie set → client middleware admits `/dashboard`; logout clears + redirects.
3. Prompt → landing auth redirect → pending prompt consumed → SSE generation streams → refresh resumes chat from DB → edit streams new variant.
4. Projects list (sort/filter/delete), template tab preview + create-from-template.
5. Settings: profile/avatars (S3 URLs), workspace rename/delete/leave, member roles, invite link + email, accept in incognito.
6. Exports: HTML/PNG/JPEG/PDF open correctly; Mailchimp file contains `*|...|*`; Gmail draft in test mailbox; Outlook draft via Graph; payload JSON downloads.
7. Billing: Stripe test checkout + `stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe`; plan upgrades; sidebar credits update.
8. Progress logs 43–53 (foundation, auth, workspaces, email-chat-sse, projects-templates-search, billing, settings-support, invites, exports-files-esp, exports-gmail-outlook, verification).

## Risks summary

- Cookie cross-origin: BFF first-party cookie (proven in apps/frontend) is source of truth; backend Set-Cookie added per mandate; prod subdomains need Domain attr.
- Plan naming: product uses Free/Basic/Medium/Pro end to end.
- One project page = one Email row; EmailChatMessage already per-email → no new chat model.
