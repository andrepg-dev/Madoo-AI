---
date: 2026-06-14
area: email-template-project (chat message editing)
files:
  - apps/client/app/email-template-project/page.tsx
---

# Editable chat messages

The pencil "Edit message" button on user messages was unwired (no `onClick`).
Wired it up.

## Behavior

- Clicking the pencil turns the `HumanMessage` into an inline auto-growing
  textarea seeded with the message text. Enter sends, Shift+Enter newlines, Esc
  / Cancel discards.
- On send, the edited text is re-submitted through the existing
  `submitChatPrompt` → `startStream("edit", …)` path, i.e. the same agent flow
  every chat turn already uses (`runEdit` on the backend). So the agent
  re-processes the corrected instruction and updates the email.
- Editing is disabled while a stream is in flight.

The backend edit agent already worked (every message after the first runs
`runEdit`); only the button was missing its handler — no backend change needed.

## In-place edit (truncate + re-run)

Editing now rewinds the conversation instead of appending:

- **Backend:** `POST /v1/emails/:id/chat/truncate` with `{ from: ISO }`
  (`TruncateEmailChatSchema`) deletes every `EmailChatMessage` with
  `createdAt >= from` (`emails.service.truncateChatMessages`). Action:
  `truncateEmailChat(emailId, from)`.
- **Client `editMessage(message, text)`:** optimistically drops the edited turn
  and everything after it, calls truncate with the message's timestamp, then
  re-submits the corrected text through `submitChatPrompt`. The first (synthetic
  brief) message uses `email.createdAt`, which clears all chat rows.

The chat→messages sync effect early-returns while streaming, so the optimistic
slice isn't clobbered before the run starts; the post-stream refetch returns the
truncated history plus the new turn.

## Limitation

Only the **chat history** is rewound, not the email **variant** state (chat
messages and variants aren't linked in the schema), so the re-run edits the
current email forward rather than restoring it to the earlier point.
Out-of-credits still gates the run.

## Verify

`tsc` clean for backend and client. Backend restart needed for the new route.
