# 105 — Working dark/light preview toggle + no all-caps text

## Problems

1. The preview's Dark/Light toggle did nothing: it flipped local state that no
   code read — the iframe rendered raw `srcDoc` untouched. Generated emails
   also contained zero dark-mode CSS, so there was nothing to toggle anyway.
2. The agent generated all-caps, letter-spaced eyebrows ("WELCOME") — looks
   unprofessional; pattern came from the prompt history and seed templates.

## Changes

### Backend (generation.prompts.ts) — deployed to VPS
- New DARK MODE required rule: every email includes an
  `@media (prefers-color-scheme: dark)` block (same <Head> <style> as the
  responsive rule, `!important`, className hooks) flipping page/surface
  backgrounds and text tones while keeping the brand accent; plus
  `<meta name="color-scheme" content="light dark" />`. Dark-by-design emails
  define light overrides instead.
- New NO ALL-CAPS rule: sentence case everywhere; explicitly told not to copy
  the uppercase eyebrows visible in the reference templates; uppercase only on
  explicit user/brand request.

### Client (EmailPreviewSidebar.tsx)
- Toggle now works by rewriting the email's dark media query before it hits
  the iframe: dark → `@media all` (forced on), light → `@media not all`
  (forced off). Deterministic regardless of the viewer's OS scheme. Old emails
  without a dark block look identical in both modes (expected).

## Verify

Generate a new email → toggle Dark: backgrounds/text flip; toggle Light:
original design. New emails: no all-caps eyebrows/headings/buttons.
- Added OUTLOOK DARK MODE prompt rule: [data-ogsc]/[data-ogsb] duplicate overrides after the media query (commit follows #105).
