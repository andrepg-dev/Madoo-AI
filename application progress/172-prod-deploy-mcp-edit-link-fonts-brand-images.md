# 172 — Prod deploy: MCP edit link + fonts + brand images + tone removal

Deployed commits `6999238..ddf40ad` to prod (server `178.104.69.183`,
`/root/Madoo-AI/apps/backend`).

## Shipped
- `6999238` fix(mcp): edit link → client `/share` route
- `8d0610d` feat(brand): capture brand font from Google Fonts links
- `5e18fea` feat(brand): more brand images, no repeats
- `ddf40ad` refactor(mcp): remove `tone` from generate_email

## Steps
1. `git pull --ff-only origin main` → HEAD `ddf40ad` (prod-only Dockerfile +
   docker-compose edits preserved, untouched by the pull).
2. **Env fix (required by the edit-link change):** prod `.env` had
   `APP_URL=http://localhost:3003` (dev value). The new ctaUrl builds
   `${APP_URL}/share/{publicId}`, so localhost would have broken the link.
   Backed up `.env` and set `APP_URL=https://my.madooai.com` (confirmed live
   client host — `/share/*` returns 200; `app.madooai.com` does not resolve).
   This also corrects billing/invite/connection links that read APP_URL.
3. `docker compose up -d --build` — rebuilt `backend-backend` + `backend-mcp`,
   recreated `madoo-backend` + `madoo-mcp`. Migrations run on boot.

## Verify
- Both containers `Up`, db/redis healthy.
- Backend: "Nest application successfully started", `/api/public/generate` mapped.
- MCP: "listening on http://localhost:4100/mcp -> backend".
- `docker exec madoo-backend printenv APP_URL` → `https://my.madooai.com`.
