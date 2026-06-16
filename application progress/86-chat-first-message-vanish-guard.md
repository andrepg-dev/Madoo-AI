# 86 - Chat first message vanishing after generation

## Problem

Right after sending the first message in `email-template-project`, the user's
opening bubble sometimes disappeared from the conversation: the view showed only
the timeline ("Worked for Ns") + the assistant reply, and the header title
collapsed to "New conversation". The data was never lost — the DB always held
the `USER` chat row, and a hard reload rendered the conversation correctly.

Root cause is in the post-stream sync effect in
`apps/client/app/email-template-project/page.tsx`. When streaming ends it
rebuilds `messages` entirely from the server queries (`mapChatMessages`) plus
client-only timeline/error rows, dropping the locally-rendered user/assistant
bubbles. If the `email`/`email-chat` queries are momentarily incomplete when the
effect runs (they can settle a beat after `done`), the rebuild produces a
**userless** list and wipes the just-sent message. `deriveConversationTitle`
then falls back to "New conversation". The race is timing-dependent (hard to hit
on a fast local machine, surfaced in the user's real session).

## Changes

- `email-template-project/page.tsx` — in the `isStreaming === false` sync
  effect, after building `merged`, guard against a transient userless rebuild:
  if `merged` has no `user` message but `previous` still holds the user's
  message for the active email, return `previous` (keep the live conversation).
  Scoped by `emailId` so switching to another/empty project still resets, and it
  self-heals once the server data is complete.

## Verification

- Pure merge-logic simulated in Node across 5 cases: healthy rebuild, race
  (userless server → preserves user), project-switch to empty (resets, no false
  preserve), fresh-empty conversation, self-heal — all correct.
- Reproduced the real flow against the running app via headless Brave
  (minted dev session): happy path still shows the first bubble + correct title
  after the fix; app never auto-scrolls; first bubble at top.
- client `tsc --noEmit` clean for the edited file.
