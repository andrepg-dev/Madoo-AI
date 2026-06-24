# 113 — Remove Tone/Length pre-generation selectors from the landing hero

## Request
"Delete from the landing page that we give audience and tone and then we make the
email template — I don't like it."

## Change
Removed the Tone/Length dropdown chips that sat under the landing hero prompt box
(the "pick tone/length, then generate" flow). The hero now just takes the prompt
(+ attachments) and generates.

`apps/landing/components/HomePage.tsx`:
- Removed the `promptOptions.map(...)` `<Select>` block from the hero composer.
- Removed `promptOptions` from both copy locales (EN + ES).
- Dropped the related state/derived values: `promptOptionValues`, `toneLabel`,
  `lengthLabel`, `selectedTone`, `selectedLength`.
- `handlePromptSubmit` now calls `clientPromptUrl(trimmed)` with no tone/length.
- The auth-resume effect no longer restores tone/length from the next URL (just
  the prompt).
- `AuthDialog` no longer receives `tone`/`length`.
- Removed the now-unused `Select` import.

Left untouched: the "Prompt. Design. Export." workflow copy still mentions
describing audience/offer/tone as generic prompt guidance (not a selector).

## Files
- `apps/landing/components/HomePage.tsx`

## Verify
- `tsc --noEmit -p apps/landing` clean.
