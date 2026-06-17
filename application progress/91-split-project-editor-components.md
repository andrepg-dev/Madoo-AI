# 91 — Split email-template-project into per-file components

## Goal
Project-wide: stop defining many components inline in one giant file. Each
section = its own component, each component = its own file. Reusability +
readability. Started with the worst offender: the editor route page.

## Before
`apps/client/app/email-template-project/page.tsx` — **3170 lines**, ~19
components + 8 types + 7 constant blocks + 13 helpers all inline, plus the main
3000-line `EmailTemplateProject` default export.

## After
`page.tsx` — **1039 lines** (main component + a tight, fully-used import block).
New tree `apps/client/components/project/editor/` (23 files):

- Modules: `types.ts`, `constants.ts`, `utils.ts`, `chat-utils.ts`
- Components: `ActionButton`, `CopyActionButton`, `HeaderMenuIcon`,
  `HeaderPillButton`, `ConversationTitleDropdown`, `ShareProjectDropdown`,
  `VersionsDropdown`, `ExportTabButton`, `ExportProviderCard`, `ExportFileCard`,
  `ExportProviderModal`, `DislikeFeedbackModal`, `EmailPreviewSidebar`,
  `HumanMessage`, `ThinkingBlock`, `AiMessage`, `StatusMessage`,
  `ErrorMessage`, `TimelineMessage`.

Each file owns its imports; cross-component deps go through relative imports
(e.g. `EmailPreviewSidebar` → `ShareProjectDropdown`, `HeaderPillButton`,
`VersionsDropdown`; `AiMessage` → `ThinkingBlock`, `ActionButton`,
`CopyActionButton`). Shared types/constants/helpers live in the 4 module files.

## Method
Extracted exact bodies by line range (no behavior change), prepended curated
import headers per file. Rebuilt `page.tsx` = pruned header + unchanged main
component body.

## Verification
- `tsc --noEmit` (client): clean, 0 errors.
- Unused-import scan across all 23 new files + `page.tsx`: none.
- Fixed one off-by-one (ErrorMessage was missing its closing brace).

## Remaining candidates (same pattern, not yet done) — awaiting go-ahead
- `apps/landing/components/HomePage.tsx` (6 comps, 1482 lines)
- `apps/client/app/(root-layout)/settings/page.tsx` (8, 1272)
- `apps/client/components/home/project-show-case.tsx` (7, 1015)
- `apps/client/components/projects/ProjectLibrary.tsx` (6, 813)
- `apps/client/components/shell/Sidebar.tsx` (6, 779)
- `apps/client/components/shell/PricingDrawer.tsx` (6, 450)
- `apps/client/components/project/preview/VariablesPanel.tsx` (4, 401)
- `apps/client/components/project/testing/AccessibilityPanel.tsx` (5, 385)
- `apps/landing/components/PricingPlans.tsx` (6, 210)
- `apps/client/components/project/testing/LinksPanel.tsx` (3, 194)
