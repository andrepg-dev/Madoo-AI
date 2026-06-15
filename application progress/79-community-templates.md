# 79 - Community Templates

## Goal

Add a global community template gallery where users can share their own emails, star community templates, edit variables before use, and materialize a template into the chat editor without losing `variableSchema`.

## Backend

- Added `Template.variableSchema`, `CommunityTemplate`, and `CommunityTemplateStar` to Prisma with migration `20260614010000_add_community_templates`.
- Added shared variable extraction from React Email default props.
- Seed and saved templates now persist `variableSchema`.
- `createFromTemplate` now compiles with `buildRenderVariables` and stores the resolved schema on the created variant.
- Added `community-templates` Nest module with list, detail, share, use, and star endpoints.

## Frontend

- Added community-template server actions.
- Extended template cards with hover star/menu actions.
- Added Community tab to the home showcase.
- Added share-to-community modal for My emails.
- Added community-template variable modal before use, with preview iframe and dynamic/static controls.

## Verification

- `pnpm --filter @madoo/shared build` passed.
- `pnpm --filter @madoo/backend prisma:migrate` applied `20260614010000_add_community_templates`.
- `pnpm --filter @madoo/backend exec tsc --noEmit --incremental false -p tsconfig.json` passed.
- `pnpm --filter @madoo/client exec tsc --noEmit --incremental false -p tsconfig.json` passed.
- Local API smoke passed: seed template produced 9 variables, My email star persisted, share/list/detail/community-star worked, use created a new email with 9 variables, edited `brandName = "Codex Labs"` persisted, and `useCount` incremented to 1.
- Client responded on `http://localhost:3003`; in-app browser was unavailable in this session, so visual E2E was not completed there.

## Follow-up

- Removed the local smoke community template named `Codex Community Smoke`.
- Added public read-only endpoint `GET /api/v1/public/community-templates` for landing consumption.
- Landing now server-fetches community templates from the backend for `/` and `/es`, validates with the shared schema, and falls back to the static showcase if the backend has no templates or is unavailable.
- Verified the public endpoint returns the real Espresso Americano community template and the landing receives it as serialized `communityTemplates` data.
- Fixed modal stacking by portaling design-system `Modal` to `document.body`, so the home `ClientPromptBox` cannot render above community-template modal.
- Public community-template endpoint and landing now omit `useCount`/`starred`; community cards no longer display use counts.
- Added a confirmation step before sharing an email to the public community gallery, with explicit privacy warning copy.
- Reviewed community-template flow for hardcoded Spanish; none remains in community client actions/UI/backend/shared contracts. Spanish visible in the gallery can come from user-authored template names/content or intentional landing `/es` copy.
