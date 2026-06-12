# 46 — Email Project: Create, Resume, Chat, SSE (Phase 3)

Date: 2026-06-11

## Context

Phase 3 wires the `apps/client` email project surface to real backend email rows, persisted chat, and SSE generation/edit routes. This pass focused on functional end-to-end wiring while preserving the current visual prototype shell.

## Shared (`packages/shared/src`)

- `emails.ts`: added `EmailChatMessageDtoSchema` and `EmailChatMessageDto` with `{id, role USER|ASSISTANT|SYSTEM, kind TEXT|THINKING|STATUS, content, createdAt}`.
- Ran required `pnpm --filter @madoo/shared build`; `packages/shared/dist` is fresh.

## Backend (`apps/backend`)

- `EmailsService.listChatMessages(emailId, workspaceId, userId)`: verifies membership + workspace ownership of the email, then returns chat messages ordered by `createdAt asc` through shared Zod DTO parsing.
- `EmailsController`: new `GET /emails/:id/chat` under existing `JwtAuthGuard + WorkspaceGuard`.

## Client (`apps/client`)

- New `actions/emails.ts` server actions:
  - `createEmail`, `fetchEmail`, `fetchEmailChat`, `fetchEmails`, `deleteEmail`, `saveEmailTemplate`, `updateEmailVariantVariableSchema`, `createEmailFromTemplate`.
- New `actions/prompts.ts` server actions:
  - `listPendingPrompts`, `createPendingPrompt`, `consumePendingPrompt`.
- New `lib/email-stream.ts`:
  - `consumeEmailSseStream()` ported/adapted from `apps/frontend`, with support for `step`, `assistant-chunk`, `subject`, `done`, `error`, `preview_url`, `brand_context`, and token usage events.
- New Next BFF SSE proxy routes:
  - `app/api/emails/[id]/generate/route.ts`.
  - `app/api/emails/[id]/edit/route.ts`.
  - Both read first-party cookies, inject `Authorization: Bearer` + `x-workspace-id`, and stream upstream response bodies.
- `components/home/ClientPromptBox.tsx`:
  - unauthenticated submit now saves pending prompt and opens `LoginModal`.
  - added optional `onSubmit` for chat-mode edits.
- `app/email-template-project/page.tsx`:
  - URL contract now handled:
    - `?id=<emailId>` resumes email + chat.
    - `?prompt=&tone=&length=&audience=` creates an email row, replaces URL with `?id=`, and streams `/generate`.
    - `?pendingPromptId=` consumes backend pending prompt, redirects to `?id=`, and polls while background generation runs.
  - Chat renders DB messages and live SSE messages instead of mock-only state.
  - Chat composer streams `/edit` with `{instruction}`.
  - Preview iframe uses latest variant `compiledHtml` or live `done.compiledHtml`.
  - Subject header uses latest variant/email title or live streamed subject.

## Verified

- `pnpm --filter @madoo/shared build` — clean.
- `pnpm --filter @madoo/backend exec tsc --noEmit` — clean.
- `pnpm --filter @madoo/client exec tsc --noEmit` — clean.
- Curl smoke:
  - `POST /api/v1/emails` with smoke user/workspace — 201 disposable DRAFT email.
  - `GET /api/v1/emails/:id` — 200.
  - `GET /api/v1/emails/:id/chat` — 200, returned empty array for new DRAFT.
  - `DELETE /api/v1/emails/:id` — 200 cleanup.
  - `POST http://localhost:3003/api/emails/test/generate` without client auth cookie — 401, proxy route compiles and guards.
  - `GET http://localhost:3003/email-template-project` with dummy auth/workspace cookies — 200, protected page compiles through dev server.

## Pending / notes

- The plan requested splitting the project page into `components/project/{ChatPanel,PreviewPanel,ExportProviderModal}.tsx`. Functional wiring is done inside the existing page, but that structural split remains.
- Full AI generation/edit SSE was not invoked during smoke to avoid spending Anthropic credits and S3 preview writes; Phase 8 should run the full flow.
- Pending-prompt consume currently uses existing backend behavior: it starts background generation. The page redirects and polls instead of attaching SSE to that already-running background job.

## Next

Phase 4: projects list, template showcase, and search palette wiring.
