# 100 - Product features section: video on first tab

Date: 2026-07-14

## What changed
- `apps/landing/components/HomePage.tsx`: first product-features tab ("Designs & Layouts")
  now renders a video (`/landing-page-video-v1.5.mp4`) instead of the static hero image.
  - No native controls, muted, loop, playsInline.
  - Custom center play/pause button, blue (`#5b63ff`), invisible by default, fades in on hover.
  - Video wrapper gets a thicker gray ring + soft shadow ("crystal" style); sized to its
    own aspect ratio (not stretched to the square panel) and centered so it doesn't take
    the full panel height.
  - Playback now driven by `IntersectionObserver`: plays when scrolled near (25% visible,
    -20% bottom margin), pauses when out of view. Manual pause via the button sticks —
    won't auto-resume on re-entry until the user presses play again.
  - Other tabs (Integrations & Export, Time Saving & Automation, Test Email Engine,
    Share & Collaboration) unchanged — still static images.

## Files
- `apps/landing/components/HomePage.tsx`
- `apps/landing/public/landing-page-video-v1.5.mp4` (asset, added by user)

## Notes
- Video source went through a few swaps during the session (`landing-page-video.mp4` →
  `product-quick-demo.mp4` → `landing-page-video-v1.5.mp4`); final state uses v1.5.
