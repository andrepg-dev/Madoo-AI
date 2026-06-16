# 88 — AI message feedback (like/dislike) persistence

## Problem
Like/dislike buttons on AI chat messages only used `localStorage`; no backend, lost across devices/reloads. Reported as "sistema de likes sigue sin funcionar".

## Solution — full-stack persisted feedback

### DB / Prisma (`apps/backend/prisma`)
- New enum `EmailChatFeedback { LIKE, DISLIKE }`.
- `EmailChatMessage.feedback EmailChatFeedback?` (nullable).
- Migration `20260616190000_add_email_chat_feedback` — applied via `prisma migrate deploy`.

### Shared (`packages/shared/src/emails.ts`)
- `EmailChatMessageDtoSchema` gains `feedback: z.enum(["LIKE","DISLIKE"]).nullable().optional()`.
- `SetEmailChatMessageFeedbackSchema` + `SetEmailChatMessageFeedbackInput`.

### Backend
- `PATCH /emails/:id/chat/:messageId/feedback` (controller).
- `EmailsService.setChatMessageFeedback` — membership + workspace + assistant/TEXT message guard, updates `feedback`, returns DTO.

### Client
- `actions/emails.ts`: `setEmailChatMessageFeedback(emailId, messageId, input)`.
- `email-template-project/page.tsx`:
  - Removed localStorage feedback helpers/state.
  - Feedback type now uppercase `"LIKE" | "DISLIKE"`, carried on message + each version.
  - `applyAiMessageFeedback` updates message/version in place.
  - `feedbackMutation` (react-query) with optimistic `onMutate`, reconcile `onSuccess`, refetch+revert+toast `onError`.
  - Toggle: clicking active feedback sends `null`.

## Verify
- `prisma migrate deploy` — applied.
- tsc --noEmit: shared, landing, backend, client all pass.

## Follow-up — UX + dislike comment
- Once a message has feedback, both 👍/👎 `ActionButton`s are hidden (no toggle-off). Copy + regenerate stay.
- LIKE → success toast "Thanks for your feedback".
- DISLIKE → persists `DISLIKE` immediately (hides buttons) + opens `DislikeFeedbackModal` (Textarea). Submit sends `{feedback:"DISLIKE", comment}`; "Skip" closes without comment. Success toast on submit.
- DB: `EmailChatMessage.feedbackComment String? @db.Text` (migration `20260616193000_add_email_chat_feedback_comment`).
- Shared: DTO `feedbackComment` + `SetEmailChatMessageFeedbackSchema.comment` (trim, max 2000, nullish).
- Backend: service updates `feedbackComment` only when `comment` provided; clears it when feedback removed.
