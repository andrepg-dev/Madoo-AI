# 49 - Landing Auth Modal Options Restored

Date: 2026-06-11

## Correction

The previous auth move reduced landing auth to Google-only. That was too narrow. Product/client still should not own login, but landing should keep the full login modal surface.

## Work

- Rebuilt `apps/landing/components/AuthDialog.tsx` with:
  - Google Identity Services
  - email/password login
  - email/password registration
  - GitHub OAuth button when `NEXT_PUBLIC_GITHUB_CLIENT_ID` is configured
  - Apple popup button when `NEXT_PUBLIC_APPLE_CLIENT_ID` is configured
- Replaced the Google-only API route with `apps/landing/app/api/auth/[provider]/route.ts` for:
  - `google`
  - `login`
  - `register`
  - `apple`
- Added `apps/landing/app/api/auth/github/callback/route.ts`.
- GitHub OAuth state carries safe client `next` plus pending prompt/dropdown fields.
- Added landing Apple auth script helper.
- Kept `apps/client` free of login/register UI and provider routes.

## Verification

- `./node_modules/.bin/tsc -p apps/landing/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- HTTP smoke:
  - `POST /api/auth/google` invalid payload returns 400
  - `POST /api/auth/login` invalid payload returns 400
  - GitHub callback without code redirects to landing with `auth_error`
  - client protected prompt URL redirects to landing with preserved `next`

## Notes

- Did not run build commands per repository instruction.
