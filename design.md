# Madoo Design Prompt

When adapting a reference design, copy the useful layout idea, not the whole page.

## Core Direction

- Keep Madoo's existing page shell, navigation, footer, spacing rhythm, and typography.
- Use the app's current fonts and Tailwind conventions.
- Prefer `madoo-paper-border` and `madoo-paper-border-hover` for card edges instead of visible hard borders.
- When saying "shadow as border" or "border shadow", match the button/card border weight: a subtle zero-blur box-shadow ring, usually `0 0 0 0.5px rgb(... / alpha)`. Do not use thick 1px borders by default, and do not add blur, large spread, halo, or drop-shadow unless explicitly requested.
- Use Madoo button styling: compact rounded-lg buttons, dark primary action, white secondary action with paper shadow.
- Official Madoo AI page background is `#f3f4f6` via `bg-madoo-page`; use it for the body/page shell unless a specific section needs its own surface.
- Keep cards compact and aligned with existing landing-page scale.
- Do not add unrelated reference-page sections unless requested.
- Use Hugeicons for most UI icons when an icon is needed. Prefer existing `@hugeicons/core-free-icons` imports and `HugeiconsIcon` rendering before text glyphs or custom SVGs.

## Palette Tokens

Palette lives in `apps/landing/app/globals.css` under Tailwind's `@theme`
`--color-*` namespace so utilities like `bg-madoo-ink`,
`text-madoo-muted`, and `bg-madoo-neutral-950` are generated.

- `madoo-ink`: primary black, used for dark buttons and active switch knob.
- `madoo-ink-hover`: dark button hover state.
- `madoo-text`: main headings and prices.
- `madoo-copy`: default body copy.
- `madoo-muted`: secondary copy and inactive controls.
- `madoo-nav`: navigation text.
- `madoo-logo`: wordmark text.
- `madoo-paper`: white card/page surface.
- `madoo-page`: official page background, `#f3f4f6`.
- `madoo-paper-tint`: translucent header surface.
- `madoo-surface`: soft blue-white page texture.
- `madoo-rule`: paper-border shadow color source.
- `madoo-accent`: deep blue badge/accent.
- `madoo-link`: link highlight.
- Tailwind-style scale aliases also exist:
  `madoo-neutral-50`, `100`, `200`, `500`, `700`, `800`, `900`, `950`,
  plus `madoo-blue-500`, `800`, `900`.

## Section Structure

Use one repeatable section rhythm for landing-page blocks:

- Section wrapper: `relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20 sm:px-8 sm:py-24`.
- Title/description group: `max-w-2xl` for left-aligned sections, `mx-auto max-w-2xl text-center` for centered sections.
- Section title: `text-4xl font-semibold leading-none text-madoo-text`.
- Section description: `mt-4 text-base leading-7 text-madoo-muted`.
- Content follows after the section header through parent `gap-10`; use `gap-4` inside card grids.
- Centered sections such as FAQ should keep the header and content centered, with FAQ/content width around `max-w-3xl`.

## Pricing Cards

- Pricing section should contain only paid plans: Basic, Medium, Pro.
- Cards should be small, readable, and consistent with existing landing components.
- Use three responsive columns on desktop and stacked/grid layout on smaller screens.
- Highlight the recommended plan with existing dark Madoo button treatment and a small `Popular` badge.
- Keep pricing copy concise and scannable.
- Use Hugeicons check/tick icons for feature rows, but avoid heavy decorative borders.

## Billing Switch

- Monthly/yearly switch should be compact and match landing controls.
- Switch knob must move correctly between states.
- Use subtle shadow styling instead of thick borders.
- Monthly/yearly labels should update active/inactive color.
- Yearly mode can show discounted monthly-equivalent pricing and clear interval text.

## Implementation Rule

Before changing a page, preserve existing user work and page structure. Scope edits to the requested component or section unless the user explicitly asks for a full-page redesign.
