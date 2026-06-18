# 101 — Remove Madoo templates, settings routes, daily-credit widgets

## Madoo templates tab removed
`components/home/project-show-case.tsx`: dropped the "Madoo templates" tab and
everything behind it — the `templates` ProjectTab, seed-template query
(`fetchTemplates`), `seedTemplates`/`toSeedTemplate`/`SeedTemplateDto`, the seed
preview query, `createTemplateMutation`, the seed-template render branch, and the
seed preview Modal. The tab row is now **My emails · Community**. Backend seed
endpoints are left intact (unused by this view, still serve generation starters).

## Settings → real nested routes
- `/settings` now redirects to `/settings/profile`.
- `/settings/[section]/page.tsx` renders the settings UI for the slug.
- Moved the page body into `settings/settings-view.tsx` (`SettingsView({ section })`)
  — no more `?area=&section=` query params. Slugs: profile, billing, sound,
  general, avatar, members, danger, support (`slugOf` maps overview→general).
- Removed the "SETTINGS" heading from the sidebar and made the sidebar **sticky**
  (`sticky top-0 max-h-[100dvh] overflow-y-auto`, static on mobile).
- Updated internal links in `Sidebar.tsx` and `ConversationTitleDropdown.tsx`
  to the new routes. Stripe `/settings/billing` return URLs now resolve to a real
  route.

## Credit widgets show daily, plan label fixed
Both the workspace sidebar widget (`Sidebar.tsx`) and the editor header dropdown
(`ConversationTitleDropdown.tsx`) now read `usage.dailyAiGenerations` (was
monthly) and read "Daily credits · {n} left · Resets {date}". The free plan label
changed from "Trial" to **"Free plan"**.

## Landing / banner left as-is
Reverted the landing `HomePage.tsx` and the client home provider-logo banner —
"Send production-ready HTML" + "Export to any provider" stay (true: you export
HTML and import it anywhere).

## Verification
- client `tsc --noEmit` — clean. No stale `settings?area=` links remain.
