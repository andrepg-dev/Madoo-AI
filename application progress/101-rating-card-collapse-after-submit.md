# 101 — Rating card collapses after submit

## Problem

The "Rate this email" card (feature #6f2b744) stayed fully open forever once an
email was READY — even after the user submitted a rating.

## Change (apps/client only)

`components/project/editor/EmailRatingCard.tsx`:
- Once a rating exists and the user is not editing, the card renders as a
  compact pill: amber star + "Rated n/5" + a "Change rating" button.
- "Change rating" expands the full editor; every successful save collapses it
  again (the page writes a fresh rating object into the React Query cache on
  success, and the collapse effect is keyed on that object identity).
- While the rating query is loading the card renders nothing, so rated emails
  no longer flash the full editor before collapsing.

No backend or shared changes. `tsc --noEmit` clean in apps/client.

## Verify

Rate an email → card collapses to "Rated n/5 · Change rating". Reload → pill
(no flash). Change rating → full card, save → collapses again. Unrated email →
full card as before.
