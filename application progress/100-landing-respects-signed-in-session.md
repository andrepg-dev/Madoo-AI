# 100 — Landing respects an existing signed-in session

## Problem
Signed-in users (valid session shared across `.madooai.com`) still saw the
login dialog — header "Login"/"Get started" and the prompt "Generate email"
button all opened `AuthDialog` (Google / GitHub / email) unconditionally. The
landing page never checked whether the visitor already had a session.

## Root cause
`apps/landing/components/HomePage.tsx` wired every CTA to `openAuthDialog()`.
The signed-in signal (`isLikelySignedIn()`, presence of the readable
`madoo.workspace.id` cookie) was only used inside `handleUseTemplate`, not for
the header or the hero/CTA prompt submit.

## Fix
`apps/landing`:
- `HomePage.tsx`
  - Added `signedIn` state, set after mount via `isLikelySignedIn()` (effect, not
    SSR, to avoid hydration mismatch).
  - New `handlePromptSubmit()`: anonymous → open auth dialog; signed-in → go
    straight to the app carrying the prompt.
  - New helpers `clientPromptUrl(prompt, tone, length)` →
    `CLIENT_APP_URL/email-template-project?prompt=…&tone=…&length=…` (the app
    already consumes these params and starts generation) and `clientHomeUrl()`.
  - Wired both submit buttons + Cmd/Ctrl+Enter to `handlePromptSubmit`.
  - Header now passes `appUrl`/`goToAppLabel` and gates `onAuthClick` when signed
    in. Added localized `goToApp` nav label (en "Open app", es "Abrir app").
- `LandingHeader.tsx`
  - New `appUrl` / `goToAppLabel` props. When `appUrl` is set, desktop + mobile
    render a single "Open app" link instead of the Login/Get started auth
    buttons.

Pricing page header unchanged (no `appUrl`/`onAuthClick`).

## Verify
`npx tsc --noEmit` in `apps/landing` passes.
