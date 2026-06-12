# Client Wiring Progress

Client-local notes for work completed during this handoff pass.

Canonical numbered repo logs remain in `application progress/`:

- `45-workspaces-wiring.md`
- `46-email-chat-sse.md`
- `47-projects-templates-search.md`
- `48-landing-owned-auth.md`
- `49-landing-auth-modal-options.md`
- `50-restore-landing-auth-ui.md`
- `51-functional-landing-auth-modal.md`
- `52-billing-pricing-drawer.md`
- `53-settings-support-invites.md`

## Files Worked On

- `actions/workspaces.ts`
- `actions/billing.ts`
- `actions/emails.ts`
- `actions/prompts.ts`
- `app/api/emails/[id]/generate/route.ts`
- `app/api/emails/[id]/edit/route.ts`
- `app/email-template-project/page.tsx`
- `components/home/ClientPromptBox.tsx`
- `components/shell/CreateWorkspaceModal.tsx`
- `components/shell/Sidebar.tsx`
- `lib/email-stream.ts`
- `actions/templates.ts`
- `components/home/project-show-case.tsx`
- `components/global/template-card.tsx`
- `components/projects/ProjectLibrary.tsx`
- `components/shell/SearchCommandModal.tsx`
- `components/auth/AuthBootstrap.tsx`
- `middleware.ts`
- `lib/auth-redirect.ts`
- `apps/landing/components/AuthDialog.tsx`
- `apps/landing/app/api/auth/google/route.ts`
- `apps/landing/lib/google-gsi.ts`
- `apps/landing/lib/cookies.ts`
- `apps/landing/lib/env.ts`
- `components/shell/PricingDrawer.tsx`
- `app/(root-layout)/settings/page.tsx`
- `app/invite/[token]/page.tsx`
- `actions/support.ts`
- `actions/invites.ts`

## Related Cross-App Work

- `apps/backend/src/workspaces/workspaces-current.controller.ts`
- `apps/backend/src/workspaces/workspaces.module.ts`
- `apps/backend/src/emails/emails.controller.ts`
- `apps/backend/src/emails/emails.service.ts`
- `packages/shared/src/emails.ts`
- `packages/shared/src/support.ts`
- `packages/shared/src/invites.ts`
- `apps/backend/src/support/`
- `apps/backend/src/mail/`
- `apps/backend/src/invites/`
- `apps/backend/src/workspaces/workspace-invites.service.ts`
