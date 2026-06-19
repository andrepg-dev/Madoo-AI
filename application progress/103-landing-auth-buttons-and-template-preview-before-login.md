# 103 — Landing auth buttons unified + view templates before login

Three issues reported from the landing page.

## 1 + 2. Auth dialog: button radius + off-palette background
`apps/landing/components/AuthDialog.tsx`

- The Google button was rendered by Google Identity Services (`renderButton`),
  which can't be restyled — it shipped its own radius and a pure-white fill with
  a grey Google border, so it didn't match the GitHub button (`rounded-lg`,
  `bg-madoo-paper`) and read as an off-palette surface.
- Fix: render our **own** Google button with the exact same classes as GitHub,
  and overlay the real GSI button on top as a transparent (`opacity-0`)
  click-catcher. Sign-in behavior is unchanged; both providers are now visually
  identical (same radius, same `bg-madoo-paper`). a11y preserved: the decorative
  visible div is `aria-hidden`, the GSI button stays focusable.

## 3. View community templates without logging in
Previously clicking a template on the landing opened the **login** dialog. Now:

- Clicking a card opens a **preview** dialog (no auth) showing the full preview
  image + the template's variables + author/description.
  - New: `apps/landing/components/TemplatePreviewDialog.tsx`.
- Only **"Use template"** requires an account:
  - `madoo.workspace.id` cookie is shared on `.madooai.com` and JS-readable, so
    `isLikelySignedIn()` checks it. Signed-in → go straight to the app deep link
    `${CLIENT_APP_URL}/use-template?id=<id>`. Not signed-in → open `AuthDialog`
    with `nextUrl` set to that deep link, so login resumes into the use flow.
  - Decorative sample cards (no `id`) funnel to sign-up as before.
- New client route that performs the use once authenticated (middleware already
  gates `/use-template` → unauthenticated visitors bounce to landing login then
  return): `apps/client/app/use-template/page.tsx`. It fetches the template
  detail, calls `useCommunityTemplate(id, variableSchema)`, then redirects to
  `/email-template-project?id=<emailId>`.

### Supporting changes
- `apps/landing/lib/community-templates.ts`: `LandingCommunityTemplate` now
  carries `variables` (the full specs, not just the count) for the preview list.
- `apps/landing/components/HomePage.tsx`: preview state + handlers, localized
  copy (`use`/`using`/`noVariables`/`close`), card click opens preview.

## Verification
- `tsc --noEmit` clean for `apps/client` and `apps/landing`.
- Not yet committed (awaiting go-ahead).
