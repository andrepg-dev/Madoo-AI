# 46 - Email Project, Chat, SSE

Date: 2026-06-11

## Client Work

- Added `actions/emails.ts` server actions:
  - `createEmail`
  - `fetchEmail`
  - `fetchEmailChat`
  - `fetchEmails`
  - `deleteEmail`
  - `saveEmailTemplate`
  - `updateEmailVariantVariableSchema`
  - `createEmailFromTemplate`
- Added `actions/prompts.ts` server actions:
  - `listPendingPrompts`
  - `createPendingPrompt`
  - `consumePendingPrompt`
- Added `lib/email-stream.ts`:
  - `consumeEmailSseStream`
  - stream event union for metadata, subject, assistant chunks, code chunks, status steps, preview URLs, done, and error events
- Added Next BFF SSE proxy routes:
  - `app/api/emails/[id]/generate/route.ts`
  - `app/api/emails/[id]/edit/route.ts`
  - both read first-party cookies, inject `Authorization: Bearer` and `x-workspace-id`, then stream backend response
- Updated `components/home/ClientPromptBox.tsx`:
  - unauthenticated prompt submit stores pending prompt and opens login modal
  - authenticated submit can route to project page or call chat-mode `onSubmit`
- Updated `app/email-template-project/page.tsx`:
  - `?id=<emailId>` resumes existing email and persisted chat
  - `?prompt=&tone=&length=&audience=` creates email, replaces URL with `?id=`, streams `/generate`
  - `?pendingPromptId=` consumes pending prompt and polls background generation
  - chat composer streams `/edit`
  - preview iframe uses latest variant HTML or streamed done HTML
  - subject header uses latest variant/email title or streamed subject

## Related Backend / Shared Work

- Added `EmailChatMessageDtoSchema` and `EmailChatMessageDto` in `packages/shared/src/emails.ts`.
- Rebuilt `@madoo/shared` after schema edit.
- Added `EmailsService.listChatMessages`.
- Added `GET /emails/:id/chat` in `EmailsController`.

## Verification

- Shared build clean.
- Backend TypeScript check clean.
- Client TypeScript check clean.
- Curl smoke covered create email, fetch email, fetch chat, delete cleanup, unauthorized client SSE proxy guard, and protected project page response through dev server.

## Notes

- Functional Phase 3 wiring is done inside existing project page.
- Planned structural split into `components/project/{ChatPanel,PreviewPanel,ExportProviderModal}.tsx` remains pending.
- Full Anthropic generation/edit SSE not invoked during smoke to avoid AI credit/S3 writes; Phase 8 should run full end-to-end flow.
