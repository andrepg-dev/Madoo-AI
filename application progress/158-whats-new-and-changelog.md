# 158 — "What's new" (in-app) + Changelog (landing)

Date: 2026-07-14
Branch: main

## Feature

Two customer-facing surfaces for recent product updates, written for users
(not devs):

- **Landing changelog** at `/changelog` (en) and `/es/changelog` (es): dated
  entries, each with plain-language feature blurbs. Footer "Changelog" /
  "Cambios" links now point here (were `/` and `/es`).
- **In-app "What's new"**: the sidebar updates dropdown (InboxIcon) now renders
  a scrollable list of the same updates instead of the empty placeholder.

## Implementation

- **Landing**
  - `components/Changelog.tsx` — `Changelog({ locale })` following the
    `LegalDocument` pattern (LandingHeader + `max-w-3xl` body). Content lives in
    an exported `changelogContent` record keyed by locale (en/es), shaped as
    dated entries → changes (`{ title, body }`).
  - `app/changelog/page.tsx` (en) + `app/[locale]/changelog/page.tsx` (es,
    `generateStaticParams` for en/es, `notFound` on unknown locale).
  - `components/LandingFooter.tsx` — repointed Changelog/Cambios links.
- **Client**
  - `components/shell/WhatsNewPanel.tsx` — static entries list, sticky header,
    `max-h` + scroll.
  - `components/shell/Sidebar.tsx` — dropdown now renders `<WhatsNewPanel />`
    (widened to `w-80`, `p-0`).

Content covers: click-to-edit in preview (incl. variable-mixed text), uploaded
images surviving AI edits, real-inbox compatibility testing, dashboard test
emails, all-templates-visible, OG preview on shared links, cleaner gallery.
Billing change (free plan → 3 credits) intentionally omitted — not a
customer-facing "feature."

## Verified

- Landing `/changelog` and `/es/changelog` → 200, title renders.
- Typechecks clean (landing + client).

Landing ships via Vercel on push; client via Vercel on push. No backend change.
