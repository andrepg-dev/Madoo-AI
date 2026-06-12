# 50 - Restore Previous Landing Auth UI

Date: 2026-06-11

## Correction

Restored the landing `AuthDialog` visual structure from git history instead of using the newly designed modal.

## Work

- Restored the previous landing login UI:
  - same card layout
  - same logo/header
  - same Google/GitHub/Apple provider rows
  - same email input + Continue block
  - same terms/privacy footer
- Kept auth behavior behind the existing buttons:
  - Google posts to landing auth route
  - GitHub redirects to OAuth callback
  - Apple uses popup helper when configured
  - pending prompt/dropdown fields are preserved
- Kept product/client without login/register UI.

## Verification

- `./node_modules/.bin/tsc -p apps/landing/tsconfig.json --noEmit`
- `./node_modules/.bin/tsc -p apps/client/tsconfig.json --noEmit`
- HTTP smoke:
  - landing page with `next` returns 200
  - invalid Google auth payload returns 400

## Notes

- Did not run build commands per repository instruction.
