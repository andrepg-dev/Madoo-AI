# 100 — Landing privacy policy page (bilingual)

## What
Added a Privacy Policy page to `apps/landing`, bilingual (en/es), GDPR + CCPA framing.

## Data inventory (source: `apps/backend/prisma/schema.prisma`)
Disclosed categories Madoo actually stores:
- **Account/identity** (`User`, `AuthAccount`): email, name, avatarUrl, locale, OAuth provider IDs (Google/GitHub/Apple), salted `passwordHash`, login timestamps, referral code.
- **Connected email accounts** (`ProviderConnection`): encrypted Gmail/Outlook access + refresh tokens, account email.
- **User content** (`Workspace`, `Email`, `EmailVariant`, `EmailChatMessage`): prompts, tone/length/audience, titles, generated HTML/code, preview images, AI chat messages, uploaded images, feedback.
- **Billing** (`BillingSubscription`): Stripe customer/subscription IDs, plan, status, trial dates. Card data handled by Stripe, not stored.
- **Support** (`SupportTicket`): contact email, subject, message.
- **Usage/technical**: Vercel Analytics, auth cookies, login timestamps, AI run metadata (`EmailGenerationRun` token counts/latency/errors).

## Sub-processors named
Anthropic (Claude / AI generation), Stripe (payments), Google/Microsoft (OAuth + email send), Vercel (hosting + analytics), DB/infra host.

## Files
- `apps/landing/components/PrivacyPolicy.tsx` — bilingual content + render (en/es dicts).
- `apps/landing/app/privacy/page.tsx` — en route `/privacy` + metadata.
- `apps/landing/app/[locale]/privacy/page.tsx` — `/es/privacy` (+ `/en/privacy`), `generateStaticParams`.
- `apps/landing/components/LandingFooter.tsx` — wired Privacy/Privacidad links (`/privacy`, `/es/privacy`).
- `apps/landing/app/sitemap.ts` — added both privacy URLs.

## Config
- Contact email: `asponceg@gmail.com` (constant `PRIVACY_CONTACT` in component).
- `LAST_UPDATED` constant: `2026-06-24`.

## Verify
- `npx tsc --noEmit` in apps/landing → exit 0.

## TODO (remaining legal/info pages requested)
términos, seguridad, contacto, blog. Footer still points these to `/` (en) and `/es` (es).
