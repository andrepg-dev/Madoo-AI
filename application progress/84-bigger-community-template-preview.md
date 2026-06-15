# 84 - Bigger community template preview

## Goal

The community-template "use" modal preview iframe felt cramped. Make it
larger.

## Changes

- `@madoo/design-system` Modal: added an `xxl` size (`max-w-260`) above
  the existing `xl` (`max-w-205`).
- `CommunityTemplateUseModal` (`project-show-case.tsx`):
  - modal `size="xl"` → `"xxl"` (wider canvas).
  - variables column trimmed `minmax(220px,320px)` → `minmax(220px,300px)`
    so the preview gets more horizontal room.
  - preview iframe `h-130` → `h-[78vh] min-h-130`; variables scroll area
    `max-h-120` → `max-h-[78vh]` to keep both columns balanced.

## Verification

- client `tsc --noEmit` passed.
