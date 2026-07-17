# 160 — Edit mode auto-closes the variables panel

**Date:** 2026-07-17

Entering visual edit mode now closes the Variables panel (full canvas for
the Design panel + preview); leaving edit mode reopens it. The effect in
`EmailPreviewSidebar.tsx` acts only on the enabled→disabled transition, so
manual Variables toggles while inside either mode are respected. Reopen is
skipped when the preview is expanded or the variant has no variables.

Verified in-browser: Edit on → Variables closed; Edit off → Variables back.
Commit `bcf1240`.
