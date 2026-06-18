# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Madoo client app. PostHog is now initialized client-side via `instrumentation-client.ts` using a reverse proxy at `/ingest`, users are identified on auth load, and 13 business events are captured across 9 files. Server-side events fire from the two email API proxy routes using JWT payload extraction for the distinct ID. A dashboard with 5 insights has been created in PostHog.

## Events instrumented

| Event | Description | File |
|---|---|---|
| `email_generation_started` | User submits a prompt to generate a new email template | `app/email-template-project/page.tsx` |
| `email_edit_submitted` | User sends a chat message to edit an existing email | `app/email-template-project/page.tsx` |
| `email_regenerated` | User clicks regenerate to get a new version of the AI response | `app/email-template-project/page.tsx` |
| `email_feedback_submitted` | User gives a thumbs-up or thumbs-down on a generated message | `app/email-template-project/page.tsx` |
| `email_exported` | User exports an email to a file format or application integration | `components/project/editor/ExportProviderModal.tsx` |
| `checkout_started` | User initiates a Stripe checkout session to upgrade their plan | `components/shell/PricingDrawer.tsx` |
| `billing_portal_opened` | User opens the Stripe billing portal to manage their subscription | `components/shell/PricingDrawer.tsx` |
| `workspace_created` | User successfully creates a new workspace | `components/shell/CreateWorkspaceModal.tsx` |
| `workspace_invite_created` | Admin creates an invite link for a workspace member | `app/(root-layout)/settings/page.tsx` |
| `support_ticket_submitted` | User submits a support request from settings | `app/(root-layout)/settings/page.tsx` |
| `workspace_invite_accepted` | User accepts a workspace invite and joins the workspace | `app/invite/[token]/page.tsx` |
| `server_email_generated` | Server-side: email generation request proxied to backend | `app/api/emails/[id]/generate/route.ts` |
| `server_email_edited` | Server-side: email edit request proxied to backend | `app/api/emails/[id]/edit/route.ts` |

## Infrastructure changes

| File | Change |
|---|---|
| `instrumentation-client.ts` | Created — initializes posthog-js with `/ingest` reverse proxy and error tracking |
| `lib/posthog-server.ts` | Created — singleton PostHog Node client for server-side events |
| `next.config.ts` | Added `/ingest/*`, `/ingest/static/*`, `/ingest/array/*` rewrites + `skipTrailingSlashRedirect` |
| `.env.local` | Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` |
| `components/auth/AuthBootstrap.tsx` | Added `posthog.identify()` on auth load and `posthog.reset()` on sign-out |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/210701/dashboard/1728792)
- [Email generation trend](https://us.posthog.com/project/210701/insights/2pWgsa9T)
- [Email to export conversion funnel](https://us.posthog.com/project/210701/insights/fHYupgc7)
- [Checkout started trend](https://us.posthog.com/project/210701/insights/z4o5K8vn)
- [Workspace creation rate](https://us.posthog.com/project/210701/insights/pPmUeAEy)
- [AI engagement: edits & regenerations](https://us.posthog.com/project/210701/insights/cxSRMzml)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any CI/deployment environment configs so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify in PostHog error tracking.
- [ ] Confirm the returning-visitor path also calls `identify` — `AuthBootstrap` identifies on every auth query resolution, so returning users should be covered, but verify in PostHog that sessions are correctly linked after a page refresh.
- [ ] Run `pnpm install` from the monorepo root to update the lockfile with the newly added `posthog-js` and `posthog-node` packages.

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
