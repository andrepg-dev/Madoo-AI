# 106 — Landing: category template showcase, /templates gallery, product-feature tabs

Date: 2026-06-22
App: `apps/landing` (marketing site). Reference: Stripo screenshots (Images #1, #2, #3).

## Scope (confirmed with user)
- Target app: **landing** marketing site.
- Image #2 gallery: **dedicated `/templates` page** (not a homepage section).

## 1. Homepage template showcase → 5-column category overview (Image #1)
- `components/HomePage.tsx` "Explore templates" section now renders one
  representative template **per category** (up to 5) in a responsive grid
  (`grid-cols-2 / sm:3 / lg:5`), each card with an uppercase category caption and
  a hover "details" pill.
- New helper `pickCategoryShowcase(cards, max)` picks first card seen per
  category. Falls back to the hardcoded sample cards when there are no community
  templates.
- Added a "Browse all templates" link → `/templates`.
- Removed the old masonry machinery (`templateMasonryWeights`,
  `getRequestedMasonryColumnCount`, `useResponsiveMasonryColumnCount`,
  `buildTemplateMasonryColumns`) now that the section is a fixed category grid.

## 2. Dedicated `/templates` gallery (Image #2)
- New route `app/templates/page.tsx` (server) — fetches templates, sets metadata,
  renders `<TemplatesGallery>`.
- New `components/TemplatesGallery.tsx` (client): header + description, search
  box, category filter chips (All + each present category with counts), uniform
  responsive grid of all community templates (`aspect-[3/4]` cards), reuses
  `TemplatePreviewDialog` + `AuthDialog` + the use-template/auth flow.
- Added "Email Templates" nav link to `LandingHeader` (new `emailTemplates` copy
  field; also added to `pricing/page.tsx` header copy). Footer "Templates" links
  now point to `/templates`.

## 3. Product characteristics → tabbed feature section (Image #3)
- Replaced the old "value" grid + dark compatibility card in `HomePage.tsx` with a
  tabbed layout: 5 tabs (Designs & Layouts, Integrations & Export, Time Saving &
  Automation, Testing & Validation, Share & Collaboration). Each tab shows a big
  uppercase title, two feature blocks, and a "Get started free" CTA; right side is
  an overlapping collage of real template screenshots.
- Content written from Madoo's actual capabilities (AI builder, brand systems,
  ESP export, portable HTML, prompt-to-email, templates, client compatibility,
  test emails, reviews/approvals, shared workspace).
- Removed now-unused `workflowSteps` / `valueFeatures` consts and 3 unused icon
  imports.

## Shared/lib changes
- `lib/community-templates.ts`: `LandingCommunityTemplate` gains `categories: string[]`
  (parsed from API, falls back to `[category]`); `fetchLandingCommunityTemplates`
  no longer slices to 7 (gallery needs all).
- `lib/client-app.ts` (new): extracted `isLikelySignedIn`, `clientUseTemplateUrl`,
  `clientPromptUrl`, `clientHomeUrl` from HomePage so the gallery reuses them.
- `HomePage.tsx` exports `localeCopy` and `TEMPLATE_ROLE_LABELS` for reuse by the
  gallery; added `nav.emailTemplates`, `templates.{browseAll,galleryTitle,
  galleryDescription,all,searchPlaceholder,empty}`, and `productFeatures` copy
  (en + es).

## Verification
- `npx tsc --noEmit` clean.
- `next build` clean after clearing stale `.next` (15 routes; `/templates`
  prerendered static, 3.42 kB).
- Note: project has no ESLint config (`next lint` is interactive), so build does
  not gate on lint.

## Follow-ups / notes
- Categories use existing `COMMUNITY_TEMPLATE_CATEGORIES` (from template data).
  Sparse today; fills out as more templates are shared.
- `/templates` is en-only (matches `/pricing`); not localized under `[locale]`.
