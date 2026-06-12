# Plan Progression

Last updated: 2026-06-11

## Current

- Current phase: Final verification - full local runtime smoke
- Next work: run servers + migrate, then exercise file/ESP/payload/Gmail/Outlook exports
- Last completed phase: Phase 7 - Exports (7A files, 7B ESP/payload, 7C Gmail/Outlook drafts) at code level

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
- [ ] Phase 8 - Testing suite (email QA modal in project sidebar)
  - [ ] 8A - Accessibility check (Axe-core, real)
  - [ ] 8B - Email Clients preview matrix
  - [ ] 8C - Your Inbox send test (Resend)
  - [ ] Links + Spam "Soon" stubs
- [ ] Final verification - full local runtime smoke

## How To Prompt Next

Use this:

```text
Phase 7 is complete at code level. Run the final verification in apps/client/progress/plan.md
(docker DB + migrate + backend/client dev), then exercise the export flows.
Update apps/client/progress/plan-progression.md when done.
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
