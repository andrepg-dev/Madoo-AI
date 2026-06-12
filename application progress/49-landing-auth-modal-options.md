# 49 - Landing Auth Modal Options Restored

Date: 2026-06-11

## Correction

The previous auth move reduced landing auth to Google-only. Product/client still should not own login, but landing should keep the full login modal surface.

## Work

- Rebuilt landing auth dialog with Google, email/password login, email/password registration, optional GitHub, and optional Apple.
- Added dynamic landing auth API route for `google`, `login`, `register`, and `apple`.
- Added landing GitHub callback route with safe `next` and pending prompt handoff in state.
- Kept product/client login/register UI removed.

## Verification

- `./node_modules/.bin/tsc -p apps/landing/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- HTTP smoke for auth API errors, GitHub callback cancel redirect, and client protected route redirect.

## Notes

- Did not run build commands per repository instruction.
