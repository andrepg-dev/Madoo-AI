# 39 — Template Cards: Credit Cost Badge

## Change

Free pre-built template cards now display a "1 credit" badge (bolt icon) in the bottom info row, informing users of the credit cost before saving.

## Motivation

Users were not aware that saving a pre-built template consumes 1 AI generation credit. The backend already enforces this via `assertCanGenerate` + `EmailGenerationRun` creation in `saveTemplate()`. The frontend now surfaces this cost on the gallery card.

## Frontend — `apps/frontend/components/home/TemplateCard.tsx`

- Bottom-right info row: added "1 credit" label with `bolt` icon for `tier !== "premium"` templates
- Premium templates keep only the star rating (already locked behind PRO badge in the card overlay)
- Style matches existing `ink-faint` text at `fontSize: 11`
