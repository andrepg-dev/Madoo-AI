# 113 — Light/dark preferences persisted in localStorage

- Preview toggle (`use-preview-layout.ts`): theme stored under
  `madoo:preview-theme`, restored after mount (post-mount restore avoids SSR
  hydration mismatch).
- Test-send scheme (`YourInboxPanel.tsx`): Auto|Light|Dark stored under
  `madoo:test-email-scheme`, same restore pattern.

Client-only; `tsc --noEmit` clean.
