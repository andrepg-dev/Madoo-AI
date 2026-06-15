---
date: 2026-06-14
area: email-template-project (inline preview scroll)
files:
  - apps/client/app/email-template-project/page.tsx
---

# Inline preview scroll cut off — fixed

## Symptom

In the inline `EmailPreviewSidebar` preview, the scroll container didn't cover
the full iframe — tall emails were clipped and scrolling hit a limit before the
end. The full-screen PreviewOverlay showed everything.

## Cause

The inline iframe used `sandbox=""` (opaque origin), so `iframe.contentDocument`
was `null` from the parent. `syncIframeHeight` reads `contentDocument` to size
the iframe (`scrolling="no"` + outer container scroll), so it early-returned and
the height stayed at the initial 900px — clipping anything taller.

## Fix

- `sandbox="allow-same-origin"` on the inline iframe so the parent can measure
  the content (no `allow-scripts`, so the trusted email HTML still can't run
  scripts).
- `handleIframeLoad` measures on load and attaches a `ResizeObserver` to the
  iframe body, re-measuring as images/fonts reflow; disconnected on unmount.

## Verify

`tsc` clean. Tall emails now scroll fully in the inline preview.
