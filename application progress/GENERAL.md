# Madoo AI — General Vision

> **Source of truth:** the public landing page (`apps/landing`). This document
> tracks the product as it is positioned and sold today, not an older roadmap.

## What is Madoo AI?

Madoo AI is an **AI-native email template *design* company**. The user describes
the email they want in plain language; Madoo writes the copy, designs the layout,
and produces a polished, on-brand, **production-ready HTML email template** the
user can export to whatever email tool they already use.

Madoo is the **design + export layer that sits upstream of the ESP**. It does
**not** try to be the ESP. The user creates the email in Madoo, then exports it
into Mailchimp, Klaviyo, HubSpot, Salesforce, Brevo, MailerLite, ConvertKit,
ActiveCampaign, Customer.io, Braze, Marketo, etc.

The bet: most email builders are *form-driven* drag-and-drop editors. Madoo is
*prompt-driven*. You describe the audience, offer, tone, and goal; Madoo returns
a finished branded email you refine by chatting, then export. No blank page, no
building sections by hand.

## Core Value Proposition

> **"Describe it in plain words. Madoo designs a production-ready email template
> and you export it anywhere."**

## In Scope (what Madoo actually does)

1. **AI email builder** — prompt → subject + body + branded layout. Refine copy,
   sections, tone, and layout by chatting. Image attachments / vision prompts.
2. **Brand kit** — upload logo, colors, fonts → consistently on-brand emails.
3. **Community templates** — start from a gallery of community-tested templates
   (categories incl. e-commerce), then let AI adapt copy/tone/audience.
4. **One-click export** — clean, portable, standards-based **HTML** (also JPEG /
   PDF). No lock-in; renders the same wherever pasted.
5. **Test email engine** — send real test emails; verify the generated HTML is
   valid; built-in checks for spam risk, broken links, and accessibility; review
   layout/copy/responsive before export.
6. **Team workspaces & collaboration** — invite teammates with roles (admin /
   member), drafts / reviews / ownership / approvals, shared workspace, shareable
   preview-template links.

## Explicitly OUT of Scope

Madoo is **not** a full email-marketing platform. It deliberately does **not** do:

- Contact / list management or segmentation.
- Sending campaigns to an audience (no SMTP/sending infra beyond *test* emails).
- Analytics (opens / clicks / bounces / unsubscribes).
- Compliance footers, unsubscribe handling, GDPR/CAN-SPAM/CASL audit data.
- Domain connection, SPF/DKIM/DMARC, IP warm-up.
- Automations, drip campaigns, lifecycle flows.

All of the above stay with the user's existing ESP. Madoo hands off a finished
template and gets out of the way.

## Use Cases (from the landing page)

- **E-commerce** — launches, discounts, abandoned-cart, win-back offers.
- **SaaS** — onboarding, feature announcements, trial nudges, churn-save.
- **Agencies** — client-ready drafts, review/approve, clean handoff.
- **Creators** — newsletters, product drops, sponsor mentions.
- **Startups** — waitlist updates, beta invites, launch & milestone emails.

## Pricing (credit-based — no contact tiers)

AI usage is metered in **credits** (generations and edits consume credits). Plans
gate credits, stored templates, members, workspaces, and test-email volume — not
contact counts. Yearly billing saves ~16%; 7-day free trial; a free tier exists.

| Plan   | $/mo | Monthly credits | Stored templates | Members | Workspaces | Test emails/day |
| ------ | ---- | --------------- | ---------------- | ------- | ---------- | --------------- |
| Basic  | $25  | 100             | 50               | 2       | 5          | 50              |
| Medium | $50  | 250             | 150              | 3       | 15         | 100             |
| Pro    | $95  | 550             | 300              | 5       | Unlimited  | 300             |

All plans: export to HTML / JPEG / PDF, share preview-template links.

## Authentication Philosophy

Login is not a wall in front of the product. A first-time visitor lands on the
home screen, types their prompt, and presses Enter. **Only then** — at real intent
— does Madoo prompt sign-in (Google in-page popup). The prompt is preserved across
the login round-trip so the user lands exactly where they left off. Zero friction
to *try*, friction only at the *commit*.

## Tech Stack (current)

- **Monorepo:** Turborepo + pnpm workspaces.
- **Apps:** `landing` (public, Next.js, EN/ES), `client` (authenticated app, work
  target), `frontend` (reference-only), `backend` (NestJS + Prisma), `admin`.
- **Frontend:** Next.js (App Router) + React + TypeScript.
- **Backend:** NestJS + TypeScript, `/api/v1`, global `ValidationPipe`, JWT.
- **Database:** PostgreSQL via Prisma.
- **Auth:** Google Identity Services (in-page popup) → ID-token verification → JWT.
- **Billing:** Stripe (7-day free trial, credit-based plans).
