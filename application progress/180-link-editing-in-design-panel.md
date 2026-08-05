# 180 — Link editing in the Design panel

Replaces the URL-editing capability lost when the Variables panel was removed
(see 178-adjacent UI removal). Editing a destination now happens where the rest
of the direct manipulation lives: select the element in the preview, change its
URL in the Design sidebar.

## The op

`setHref` added to `VisualEditOpSchema`:

- Accepts `http(s)://`, `mailto:` and `tel:` — everything else is rejected,
  notably `javascript:` and `data:`, because the value is written into the
  stored TSX and the exported HTML.
- Rejects whitespace and quote/angle characters for the same reason.

## Backend

`tsx-visual-ops.ts` gains `setLinkHref`, mirroring `setImageSource`:

- Only `Button`, `Link` and `a` are linkable; anything else throws.
- **The important case:** generated CTAs are written as `href={ctaUrl}` bound to
  a prop default. When the href is a prop binding, the *default* is rewritten
  and the variable name is returned so the variant's `variableSchema` is updated
  through the existing `variableUpdates` channel. Without that the UI edit would
  be silently reverted by the stale schema default on the next render — which is
  exactly what the Variables panel used to handle.
- A literal href is replaced in place; an element with no href gets one added.

4 new tests in `tsx-visual-ops.spec.ts` cover literal replacement, the prop
binding + schema sync, adding a missing href, and the non-link rejection. Suite:
44/44.

## Client

- `useVisualEditSelection.ts` — selection now carries `link: string | null`,
  read from the selected node (`<Button>`/`<Link>` both render as `<a>`) or a
  directly nested anchor. A placeholder `#` still counts as a link so the user
  can fix it; an anchor with no href attribute at all does not.
- `StylePanel.tsx` — a "Link" section appears above "Text" whenever the
  selection has a link. Commits on blur or Enter, validates the scheme inline
  before sending, and shows `#` as an empty field so it reads as "needs a URL".
- `EmailPreviewSidebar.tsx` — passes `link` and `onCommitLink`, which dispatches
  `{ op: "setHref" }` through the existing `onApply` pipeline, so autosave,
  optimistic update and variant creation all work unchanged.

## Notes

- Type-checks clean on both apps. Backend suite 78/79 — the one failure is the
  pre-existing `credit-window.spec.ts` mismatch from the uncommitted free-plan
  bump in `packages/shared/src/billing.ts`, unrelated to this work.
- Not yet deployed to prod.
