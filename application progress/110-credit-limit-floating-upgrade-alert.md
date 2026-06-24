# 110 — Credit-limit error shows floating upgrade alert, not a red bubble

## Problem
Hitting the AI credit cap during a generation (e.g. Free daily cap) surfaced the
backend `ForbiddenException` ("Daily AI credit limit reached: …") as a **red
error message in the chat**. The intended UX is the floating **yellow alert with
an Upgrade link above the prompt box** — which already existed in
`ClientPromptBox` (`showCreditsAlert`) but only triggered on the monthly
`aiGenerations` usage from billing-overview, never on a daily-cap stream error.

## Fix
- `apps/client/components/home/ClientPromptBox.tsx`: new optional props
  `creditLimitMessage` + `onDismissCreditLimit`. The yellow alert now shows when
  either the internal monthly check trips **or** an external message is provided,
  rendering that message text plus the existing "Upgrade to <plan>" link. Dismiss
  routes to the parent handler when externally driven.
- `apps/client/app/email-template-project/page.tsx`:
  - `isCreditLimitError()` helper (matches "credit limit reached" / "credits per
    day|month").
  - `startStream` error handling (both the SSE `error` event and the outer catch)
    routes credit-cap errors to a new `creditLimitMessage` state and finishes the
    timeline instead of pushing a red error bubble.
  - Cleared at the start of each new send; wired to the chat `ClientPromptBox`
    via `creditLimitMessage` / `onDismissCreditLimit`.

Non-cap errors still render as red error messages. Home box keeps its internal
monthly alert.

## Files
- `apps/client/components/home/ClientPromptBox.tsx`
- `apps/client/app/email-template-project/page.tsx`

## Verify
- `tsc --noEmit -p apps/client` clean.
- Manual: exhaust the daily cap → on send, a yellow floating alert with the cap
  message + Upgrade link appears above the textarea (no red bubble); sending a
  new message or dismissing clears it.
