# 157 — Landing template pages: "Test compatibility" send-to-inbox

Date: 2026-07-14
Branch: main

## Feature

On the landing template detail page (/templates/[id]), under the "Use
template" button, visitors now get a compatibility tester: Gmail / Outlook /
Apple Mail logos, an email input, and a "Test compatibility" button on the
right. Submitting mails them the template so they can see how it renders in
their real client. Copy localized (en/es).

## Implementation (full stack)

- **Shared** (`testing.ts`): `PublicTemplateTestSendSchema` (`{ to: email }`)
  + response schema.
- **Backend**: `POST /public/community-templates/:id/test-send`
  (`PublicCommunityTemplatesController`), unauthenticated by design like the
  other public template endpoints. `CommunityTemplatesService.
  sendPublicTestEmail` loads the public template (seed or community row) and
  sends its compiledHtml via the existing `MailService.sendTestEmail`
  (Resend). Abuse guard: in-memory daily caps — 3 sends per recipient, 200
  global; counters reset at UTC midnight. `MailModule` added to
  `CommunityTemplatesModule` imports.
- **Landing**: `app/api/template-test/route.ts` proxies to the backend
  (same pattern as trial-claim). `TemplateDetail.tsx` gained
  `CompatibilityTester` (inline provider-logo SVGs, input, button, sent/error
  states) and `HomePage.tsx` locale copy gained the compatibility strings.

## Verified

- Direct endpoint: `{ ok: true, skipped: false }` — real Resend delivery.
- Landing UI end-to-end on localhost: typed address, clicked Test
  compatibility, got "Sent! Check your inbox to see how it renders."
- Typechecks clean (backend, landing); 52/52 backend tests pass.

Backend deploy required for prod; landing ships via Vercel on push.
