# 112 — Test email: choose Light / Dark / Auto scheme

## Feature

The test-send panel now lets the user pick which color scheme the test email
arrives in.

## Changes (full chain)

- `packages/shared/src/testing.ts`: `SendTestEmailInputSchema` gains optional
  `scheme: "auto" | "light" | "dark"`. Shared package rebuilt.
- Backend `testing.service.ts`: new `forceColorScheme` helper — selected
  scheme's `prefers-color-scheme` block forced on (`@media all`), the other
  forced off (`@media not all`), color-scheme meta stripped so the recipient's
  client doesn't re-adapt; applied before `inlineCss`. `auto`/absent sends the
  HTML untouched. Same emulation the preview toggle uses.
- Client `YourInboxPanel.tsx`: Auto | Light | Dark SegmentedControl above the
  send button; `scheme` sent only when not auto (backward compatible).

## Verify

Test panel → pick Dark → email arrives dark even in a light-mode client; Light
locks light; Auto behaves as before. Emails without scheme blocks are
unaffected by the choice.
