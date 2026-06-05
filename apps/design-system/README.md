# `@madoo/design-system`

Standalone Storybook app for the new Madoo AI design system.

This app lives inside the monorepo under `apps/design-system`, while the actual reusable tokens and React components stay in `packages/ui`.

## Run

```bash
pnpm --filter @madoo/design-system dev
```

Storybook runs on `http://localhost:6008`.

## Structure

- `apps/design-system/.storybook`: Storybook shell and theme config.
- `packages/ui/src/tokens`: design tokens, fonts, base reset, shared visual helpers.
- `packages/ui/src/foundations`: brand, color, typography, and token stories.
- `packages/ui/src/components`: reusable component stories.
