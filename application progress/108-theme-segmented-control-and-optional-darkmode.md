# 108 — Theme segmented control + dark-mode as judgment call

## Findings

The scheme toggle logic was verified working (the regex transform was tested
against variant 13's exact compiled CSS, and the same HTML switched correctly
with the OS scheme in codi.link). The perceived bug was UX: the old button
showed the TARGET mode ("Light" while dark was active), reading as broken.

## Changes

### Client
- Theme toggle replaced with a Light | Dark SegmentedControl (same pattern as
  Desktop/Responsive), active state always visible. Removed the Moon/Sun
  target-labeled button.

### Backend prompt (deployed to VPS)
- DARK MODE downgraded from required to judgment call per user request: light
  marketing emails usually should carry the dark block, but deliberate
  fixed-look designs (dark luxury/dev/nightlife, art-directed palettes) may
  lock their palette with no scheme blocks. User preference always wins.
- OUTLOOK [data-ogsc]/[data-ogsb] duplication now conditional on scheme
  overrides being present at all.
