# Plan Progression

Last updated: 2026-06-13

## Current

- Current phase: Phase 8 verification - email testing suite runtime smoke
- Next work: restart backend dev so the new testing route is live, then browser-test the Testing modal and run the Axe/email-client/inbox flows.
- Last completed phase: Phase 8 - Testing suite at code level

## Phase Checklist

- [x] Phase 0 - Client plumbing foundation
- [x] Phase 1 - Auth, cookies, middleware, logout
- [x] Phase 2 - Workspaces, sidebar, credits
- [x] Phase 3 - Email project, SSE generation, chat resume
- [x] Phase 4 - Projects list, templates, search
- [x] Phase 5 - Billing
- [x] Phase 6 - Settings, support, invites
- [x] Phase 7A - File exports: HTML, PNG/JPEG, PDF, AMP coming soon, client download proxy
- [x] Phase 7B - ESP exports: provider merge tags, ESP-ready HTML, payload JSON
- [x] Phase 7C - Gmail/Outlook OAuth drafts
- [x] Phase 8 - Testing suite (email QA modal in project sidebar)
  - [x] 8A - Accessibility check (Axe-core, real)
  - [x] 8B - Email Clients preview matrix
  - [x] 8C - Your Inbox send test (Resend)
  - [x] Links + Spam "Soon" stubs
- [ ] Final verification - full local runtime smoke

## Verification Notes

- Added missing Prisma baseline migration `20260428170000_phase1_core`; `pnpm --filter @madoo/backend prisma:migrate` now passes.
- Phase 7 export smoke passed for HTML, PNG, JPEG, PDF, Mailchimp ESP, payload JSON, and client download proxy.
- Phase 8 backend dev compile passed with 0 errors on a temporary `PORT=4010` run.
- `POST /emails/:id/test/send` returned `{ ok: true, skipped: true }` with Resend env unset.
- Client project page returned 200 and included the new Test UI.
- Not yet verified in browser: opening the modal and clicking through Accessibility / Email Clients / Your Inbox, because the in-app browser backend was unavailable.
- Live Resend inbox delivery needs `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- Live Gmail/Outlook draft smoke still needs OAuth account connection; Outlook also needs `MS_CLIENT_ID` / `MS_CLIENT_SECRET`.

## How To Prompt Next

Use this:

```text
Phase 8 is complete at code level. Restart backend dev, open a ready email in
`/email-template-project`, then verify the Testing modal tabs. Configure Resend
for live inbox delivery and Microsoft OAuth env for Outlook draft smoke.
```

## Progress Logs

- `45-workspaces-wiring.md`
- `46-email-chat-sse.md`
- `47-projects-templates-search.md`
- `48-landing-owned-auth.md`
- `49-landing-auth-modal-options.md`
- `50-restore-landing-auth-ui.md`
- `51-functional-landing-auth-modal.md`
- `52-billing-pricing-drawer.md`
- `53-settings-support-invites.md`
- `54-exports-files.md`
- `55-exports-esp-payload.md`
- `56-exports-gmail-outlook.md`
