# 103 — Rating card fully disappears once rated

Supersedes #101. The collapsed "Rated n/5 · Change rating" pill was still too
much: per feedback, once an email has been rated NOTHING should render.

## Change (apps/client only)

`components/project/editor/EmailRatingCard.tsx`:
- `if (loading || rating) return null;` — the card only exists to collect the
  first rating. Submitting updates the query cache, so it vanishes immediately.
- Removed the pill, the expand state, and the now-dead "Update"/"Update your
  rating anytime" copy (always "Submit" / "Help tune future output").

Ratings remain one-per-email in the backend (existing upsert endpoint
untouched) — there is simply no UI to change one after submission.

`tsc --noEmit` clean.
