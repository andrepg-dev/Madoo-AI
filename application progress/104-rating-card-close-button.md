# 104 — X close button on the rating card

## Change (apps/client only)

`EmailRatingCard.tsx`:
- X icon button next to the stars dismisses the card without rating.
- Dismissal persisted per email in localStorage
  (`madoo:rating-card-dismissed:<emailId>`), so a closed card stays closed
  across reloads. New `emailId` prop threaded from the project page.
- Card renders nothing when: rating loading, rating exists, or dismissed.

`tsc --noEmit` clean.

## Verify

Unrated email → card with X. Click X → gone, reload → still gone. Different
email → card shows again. Rated email → gone regardless (behavior #103).
