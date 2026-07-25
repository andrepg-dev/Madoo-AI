# 167 — MCP server for Claude / ChatGPT (distribution play)

Goal: expose Madoo email generation over MCP so Claude/ChatGPT users can generate emails
from inside their chat → public preview link + signup CTA = new-customer acquisition channel.

## Decisions (user)
- Scope: **both** custom tools + LLM bridge.
- Generate tool audience: **anonymous acquisition** (not existing-users-only).
- User-tool auth: **OAuth 2.1** (phase later).
- Deploy target: **VPS** (178.104.69.183), docker compose alongside backend.

## Built this pass — `apps/mcp` (new workspace app)
- Streamable HTTP MCP server (stateless) at `POST /mcp`, `/health`.
- Tools: `generate_email` (anon → backend `POST /public/generate`), `list_email_templates`,
  `ask_model` (Claude/GPT bridge, hidden if no key).
- `Dockerfile`, `.env.example`, `README.md` (nginx TLS + connect steps).
- Wired `mcp` service into `apps/backend/docker-compose.yaml` (reaches `backend:4000`).
- Builds clean (`pnpm --filter @madoo/mcp build`).

## Built — backend anonymous endpoint (`apps/backend/src/public-generate/`)
Decisions: **3/IP/day, fully open (no email gate)**.
- `POST /api/v1/public/generate` (service-token guarded) → `{publicId, previewUrl, ctaUrl, subject}`.
- `ServiceTokenGuard` — constant-time compare of `x-madoo-service-token` vs `MADOO_SERVICE_TOKEN`.
- `AnonRateLimiter` — in-memory, per-IP (`ANON_PER_IP_DAILY`=3) + global (`ANON_GLOBAL_DAILY`=200)
  daily caps, reset 00:00 UTC, refunds on failure. NOTE: single-process; move to Redis if API scales.
- `PublicGenerateService`: lazy anon user+workspace (`anon@madoo.internal`), `emails.create` →
  `generation.generateAnonymousToCompletion` (new method, **skips billing** via `runInitial` flag) →
  `emails.setShare` PUBLIC → "Made with Madoo" footer injected into latest variant → build share URLs.
- Shared contract: `packages/shared/src/public-generate.ts` (`PublicGenerateSchema` / `...ResultSchema`).
- Templates tool hits existing `GET /public/community-templates` (no new endpoint).

### Backend env to set (apps/backend/.env)
`MADOO_SERVICE_TOKEN` (match MCP), `PUBLIC_WEB_URL` (else falls back to first CORS_ORIGINS),
optional `ANON_PER_IP_DAILY`, `ANON_GLOBAL_DAILY`, `MCP_UTM_SOURCE`.
Generation reuses existing backend `ANTHROPIC_API_KEY` — no new key.

## DEPLOYED TO PROD 2026-07-25 — LIVE
Connector URL: **https://api.madooai.com/mcp** (Streamable HTTP, stateless).
- nginx `location /mcp` on existing `api.madooai.com` cert → docker `madoo-mcp` @ `127.0.0.1:4100`. No new DNS.
- Merged compose preserved VPS prod hardening (loopback db/redis binds, redis auth, DATABASE_URL_DOCKER).
- Env: MADOO_SERVICE_TOKEN (backend .env + apps/mcp/.env), PUBLIC_WEB_URL=https://madooai.com,
  PUBLIC_API_URL=https://api.madooai.com/api/v1.
- Verified end-to-end: initialize + tools/list + generate_email over HTTPS; preview view returns
  200 text/html rendering the email.

### Preview fix (frontend has no /share route deployed)
Marketing site at madooai.com; no app subdomain. Added self-hosted
`GET /api/v1/public/emails/:publicId/view` → serves compiledHtml directly. Preview link points here,
independent of the Vercel frontend. CTA link → madooai.com root.

## Remaining (user action / future)
- USER must add the connector in their own Claude/ChatGPT settings (cannot be done for them).
- Optional: set ANTHROPIC_API_KEY in apps/mcp/.env to enable `ask_model` bridge.
- Future: OAuth 2.1 existing-user tools; move rate limiter to Redis if API scales.

## Honest distribution note
MCP connectors are NOT auto-discovered — users add manually or via approval-gated directory.
Real acquisition = the watermarked public email + "Made with Madoo" viral link, not the listing.
