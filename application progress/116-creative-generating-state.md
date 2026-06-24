# 116 — Creative "AI is generating" state (live steps + skeleton email)

## Request
The generating state was a bare spinner; make it more creative.

## Change (chosen: both combined)
**Chat — live shimmer caption** (`components/project/editor/TimelineMessage.tsx`):
the spinner now sits beside a shimmering caption. It shows the real backend step
label when one has streamed in (these were already emitted but hidden), and
otherwise cycles playful build lines ("Sketching the layout…", "Picking colors &
type…", …) every ~2.4s. Still renders nothing once finished.

**Preview pane — skeleton email** (`components/project/editor/EmailSkeleton.tsx`):
while generating with no rendered email yet, the right pane shows a shimmering
placeholder email (header + nav, hero, body lines, CTA, footer socials) so the
preview side feels like an email forming instead of empty space.

**Styles** (`app/globals.css`): added `madoo-text-shimmer` (gradient text sweep)
and `madoo-skeleton` (sweeping highlight) animations, both disabled under
`prefers-reduced-motion`. Uses the existing `--ink-shadow-rgb` token.

**Wiring** (`app/email-template-project/page.tsx`): new `isGenerating`
(`isStreaming || email.status === "GENERATING"`); the preview column renders
`<EmailSkeleton />` when `!hasPreview && isGenerating` (lg+), so the chat shifts
left as if the real preview were loading.

## Files
- `apps/client/components/project/editor/TimelineMessage.tsx`
- `apps/client/components/project/editor/EmailSkeleton.tsx` (new)
- `apps/client/app/email-template-project/page.tsx`
- `apps/client/app/globals.css`

## Verify
- `tsc --noEmit -p apps/client` clean.
- Manual: start a generation → chat shows a shimmering step caption; the preview
  pane shows a shimmering skeleton email until the real one renders.
