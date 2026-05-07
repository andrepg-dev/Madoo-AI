# 35 — Real Crafted Templates

## What changed

### `apps/frontend/lib/data.ts`
- Fixed CATEGORIES: `["All","Launch","Newsletter","Promotion","Onboarding","Event","Transactional","Engagement","Growth"]`
- Updated template category fields so all 12 map to a filter tab (previously 5 templates — Changelog, Product, Engagement, Re-engagement, Growth — only appeared under "All")
- Merged: Changelog → Launch, Product → Launch, Re-engagement → Engagement

### `apps/frontend/components/templates/TemplatePreview.tsx`
- Full rewrite of all 12 preview cards
- `feature`: replaced broken "preview" dashed placeholder with an actual UI mockup visual (title bar + content rows + action area)
- `launch`, `welcome`, `event`, `reengage`, `referral`: now use dark/color header bar at top matching the real email layout
- `thanks`: added order summary box with line items
- `sale`: full-bleed orange header, large typography
- All previews use proper aspect-ratio fills with visually distinct top sections

### `apps/backend/src/templates/seed-templates.ts`
- Full rewrite of all 12 `componentCode` values
- Correct component pattern: `const Email = ({ var = 'default', ... } = {}) => ...; export default Email;`
- Each template has: brand header, hero section, rich content (multi-column, feature blocks, order tables, step lists), footer with unsubscribe
- Merge variables wired throughout (brandName, firstName, ctaUrl, etc.)
- Colors match the frontend data.ts accent/bg pairs

### `apps/backend/src/templates/templates.service.ts`
- Changed `update: {}` → `update: { name, category, description, componentCode }` so existing workspaces get the new templates on next list call

## Result
- All 12 template cards visible in their respective category filter tabs
- Template previews look like polished email designs (no placeholder text)
- Clicking any template seeds Claude with a rich, structured React Email reference for that layout type
- TypeScript passes clean on both frontend and backend
