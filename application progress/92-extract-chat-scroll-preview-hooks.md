# 92 — Extract chat-scroll & preview-layout hooks from page

## Why
`apps/client/app/email-template-project/page.tsx` was a 1039-line component owning
~38 `useState`/`useRef` lines across six unrelated concerns (streaming, chat,
scroll, preview, startup, modals). User asked whether react-hook-form or zustand
would manage it better.

## Decision
- **react-hook-form: rejected.** Not a form. The single input (`ClientPromptBox`)
  owns its own state. No fields/validation/submission to manage.
- **zustand: rejected for this state.** Already used correctly for cross-page shell
  state (`sidebarOpen`, `pricingOpen`). The rest is page-scoped — a global store
  would force manual reset on unmount and leak stale state on re-entry.
- **Chosen: extract custom hooks.** Real issue is one file doing six jobs, not the
  state primitive. Low-risk first pass: the two self-contained, non-streaming
  clusters.

## Changes
- New `apps/client/hooks/use-chat-scroll.ts` — owns `messagesRef`, `latestUserRef`,
  the scroll-down affordance (`canScrollDown`/`updateScrollState`), one-shot
  jump-to-bottom on first paint, and `requestUserScroll()` to pin a sent message to
  the top. Behavior preserved 1:1.
- New `apps/client/hooks/use-preview-layout.ts` — owns preview `mode`, `theme`,
  `width`/`widthBeforeExpand`, `expanded`, `overlayOpen`, plus `changeWidth`,
  `toggleExpanded`, `collapse`. Behavior preserved 1:1.
- `page.tsx`: removed the moved state/refs/effects/handlers, wired both hooks.
  Aliased hook outputs to existing local names to keep the JSX diff minimal. Only
  semantic change at call sites: `pendingUserScrollRef.current = true` →
  `requestUserScroll()`, and sidebar effect `setPreviewExpanded(false)` →
  `collapsePreview()`.

## Result
- page.tsx: 1039 → 965 lines (−102 / +28).
- `tsc --noEmit` on apps/client: clean.
- Streaming (`useEmailStream`) and chat (`useEmailChat`) clusters deferred to a
  follow-up pass (higher risk: intricate closure-mutated stream state).
