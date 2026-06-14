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

## Note

This re-sends the edited instruction as a new turn rather than truncating
history in place (that would need backend chat-history mutation). Out-of-credits
still gates the run as usual.

## Verify

`npx tsc --noEmit -p apps/client/tsconfig.json` → clean.
