# 156 — Home shows every template; test emails from the home page

Date: 2026-07-14
Branch: main

## 1. All templates on the dashboard home

`ProjectShowCase` capped the "My templates" masonry at the 10 most recently
updated (`slice(0, 10)`), so accounts with more projects (prod account has 36)
never saw the rest on the home page — read as "not all templates are shown".
The cap is gone; the grid now renders every email, still sorted by last
update. The /dashboard/projects page was already complete (verified 36/36 on
prod) and is unchanged.

## 2. Test Email Engine from the home page

Template cards on the home page now carry a "Test email" action in their
"…" menu (next to "Share to community"). It opens the existing
`TestingModal` (Your Inbox / Accessibility / Links / Spam) fed with the
card's latest variant — emailId, variantId, and compiledHtml straight from
the already-fetched `EmailDto`, so no new endpoint was needed.

Files: `apps/client/components/home/project-show-case.tsx`,
`apps/client/components/home/show-case-menus.tsx`.

Verified in the running app: home grid renders all 12 local templates
(previously 10), card menu shows both actions, and "Test email" opens the
Test Email Engine modal with all four tabs. Client typecheck clean.

Client-only change — deploys via Vercel on push; no backend deploy needed.
