# Madoo AI — General Vision

## What is Madoo AI?

Madoo AI is an **AI-native email marketing platform**. The user describes the email they want in plain language; Madoo writes it, designs it, and ships it. The product collapses three roles — copywriter, designer, and email-ops engineer — into a single conversational interface.

The bet: most email tools (Mailchimp, Klaviyo, ActiveCampaign) are *form-driven*. Madoo is *prompt-driven*. The form-driven era treated emails as templates to be filled in. Madoo treats them as outputs to be generated, edited, and iterated on like a doc in ChatGPT.

## Core Value Proposition

> **"Describe it in plain words. Madoo writes, designs, and ships it."**

Users do not learn a builder. They type, hit Enter, get a finished branded email, edit anything by chatting with the AI, then send it to a real audience from their own verified domain.

## The Full Stack of Capabilities

A real email SaaS — not just a generator — requires six pillars:

1. **AI Generation** ✅ *(prototype complete)*
   Prompt → subject + body + layout, with controls for tone / length / audience.

2. **Editor + Preview** ✅ *(prototype complete)*
   Live preview of the rendered email, AI-assisted edits, variant browsing (v1 / v2 / v3 — naturally pairs with subject-line A/B testing later).

3. **Sending Infrastructure** ⬅️ *the next big build*
   Madoo does **not** run its own SMTP. It rides on top of **Resend / Postmark / Amazon SES** under the hood and presents a single branded surface to the user.
   - Madoo handles: verified domains, SPF / DKIM / DMARC automation, IP warm-up.
   - User sees: *"Connect your domain → Send."*

4. **Contacts & Audiences**
   - CSV import.
   - Basic segmentation (tags, behavior).
   - Sync API for Shopify / Stripe / the user's own app.

5. **Analytics**
   - Open rate, click rate, bounce rate, unsubscribes.
   - A/B testing on subject lines — slots cleanly into the existing `v1 / v2 / v3` variant model in the editor.

6. **Compliance**
   - Automatic unsubscribe link.
   - GDPR / CAN-SPAM / CASL footers and audit data.
   - Optional double opt-in.

## Roadmap

### MVP — months 1–4
- AI generation + editor (done in the prototype).
- Sending via Resend API under the hood.
- CSV import + lists.
- Basic analytics (opens / clicks).
- **Pricing:** $19/mo up to 1k contacts, $49/mo up to 5k.

### v2 — month 6
- Premium templates (freemium model).
- Segmentation + tags.
- Automated A/B testing.

### v3 — month 12
- Automations (welcome series, drip campaigns).
- Integrations (Shopify, Stripe webhooks).

## Screens Already in the Prototype

The frontend at `apps/frontend` already mirrors the full vision so the product story is legible end-to-end, even where the backend is not yet wired:

| Screen        | Route          | Purpose                                                                                                  |
| ------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| Home          | `/`            | Hero prompt + tone/length/audience pills + template gallery. Entry point of the AI generation flow.      |
| Generating    | (state)        | Loading state while the model produces subject + body + layout.                                          |
| Editor        | (state)        | Live preview, AI-assisted edits, variant switching (v1 / v2 / v3).                                       |
| Contacts      | `/contacts`    | Lists, segments, CSV import surface, tags. Closes the "who do I send to" half of the loop.               |
| Campaigns     | `/campaigns`   | Schedule, pick audience, A/B test, 5-step compose modal. Closes the "create → send" loop.                |
| Analytics     | `/analytics`   | Post-send dashboard — opens, clicks, bounces, unsubscribes.                                              |
| Domain        | `/domain`      | "Connect your domain" flow with DNS records — the gate that turns Madoo into a real sender, not a toy.   |

The recommendation that drove screen prioritization: **Contacts and Campaigns first**, because together they close the *"I created an email → I sent it"* loop. Analytics and Domain layer on once the loop is real.

## Authentication Philosophy

Login is not a wall in front of the product. A first-time visitor can:

1. Land on the home screen.
2. Type their prompt.
3. Press Enter.

**Only at that moment** — when the user has expressed real intent to send something — does Madoo prompt them to sign in. The prompt is preserved across the login round-trip via `localStorage` + a `PendingPrompt` row on the backend, so the user lands exactly where they left off, with their message intact. Login is Google-popup-only (Google Identity Services, in-page) — never a full-page redirect, never a flow break.

This is a deliberate growth design: zero friction to *try*, friction only at the *commit*.

## Tech Stack (current)

- **Monorepo:** Turborepo + pnpm workspaces.
- **Frontend:** Next.js 15 (App Router) + React 19 + TypeScript. Inline styles + CSS variables for design fidelity (no Tailwind in the prototype).
- **Backend:** NestJS 10 + TypeScript, URI versioning at `/api/v1`, global `ValidationPipe`, JWT sessions.
- **Database:** PostgreSQL 16 via `docker-compose`, accessed through Prisma 5.
- **Auth:** Google Identity Services (in-page popup) → `google-auth-library` ID-token verification on the backend → JWT.
- **Sending (planned):** Resend (default), with Postmark / SES as alternative drivers behind the same internal interface.

## Success Criteria for the MVP

A user with no prior email-marketing experience must be able to:

1. Land on Madoo, type a prompt, see a rendered branded email in under 30 seconds.
2. Sign in with Google in one click without losing their prompt.
3. Connect their own domain (DNS-verified, SPF/DKIM/DMARC auto-configured).
4. Import a CSV of contacts.
5. Send the email and see opens + clicks within 24 hours.

If those five steps work without any documentation, Madoo is shippable.
