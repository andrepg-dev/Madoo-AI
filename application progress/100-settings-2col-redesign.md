# 100 — Settings redesign (2-column grouped sidebar)

## Problem
Settings used a 3-column layout (areas column + sub-sections column + content)
which felt heavy. Support area and overall structure looked unpolished.

## Change (apps/client/app/(root-layout)/settings/page.tsx)
- Collapsed to **2 columns**: one 264px sidebar + content. Middle column removed.
- Sidebar lists every section grouped under headers:
  - Account → Profile, Billing & usage, Completion sound
  - Workspace → General, Avatar, Members, Danger zone
  - Support → Contact support
- Replaced `primaryNav`/`accountNav`/`workspaceNav` + two nav-link components
  with a single `navGroups` model and one `SettingsNavRow` (icon + label, active
  row highlighted with accent icon).
- Active item resolved from `area` + `section`; header shows group as eyebrow,
  item label as title, item description as subtitle. Content centered at max-w-3xl.
- Polished the Support panel: styled "Request sent" confirmation box, an inline
  "reply within 1–2 business days" helper, and a "Sending…" pending state.

## Verification
- client `tsc --noEmit` — clean. No stale references to the removed nav symbols.

## Note
URL contract unchanged (`/settings?area=...&section=...`), so existing links
(e.g. `/settings/billing` redirects, billing invalidations) still work.
