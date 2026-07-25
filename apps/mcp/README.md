# Madoo MCP Server

Remote [Model Context Protocol](https://modelcontextprotocol.io) server that exposes Madoo's
AI email generation to **Claude**, **ChatGPT**, and any other MCP-capable client.

Transport: **Streamable HTTP** (stateless) at `POST /mcp`. Both Claude and ChatGPT remote
connectors speak this protocol.

## Tools

| Tool | Auth | Purpose |
|------|------|---------|
| `generate_email` | none (anonymous) | Generate a styled HTML email from a brief → returns a public preview link + signup CTA. **The acquisition hook.** |
| `list_email_templates` | none | List prebuilt templates. |
| `ask_model` | none | Bridge: forward a prompt to Claude or GPT (only registered if a provider key is set). |

> The anonymous `generate_email` tool calls the backend `POST /api/v1/public/generate`
> endpoint (rate-limited, watermarked). That endpoint is built in the backend app.

## Local dev

```bash
cp apps/mcp/.env.example apps/mcp/.env   # fill MADOO_SERVICE_TOKEN
pnpm --filter @madoo/mcp dev
# then point a client at http://localhost:4100/mcp
```

Quick smoke test:

```bash
curl -s http://localhost:4100/health
curl -s -X POST http://localhost:4100/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Deploy on the VPS (docker compose)

A `mcp` service is already wired into `apps/backend/docker-compose.yaml` and reaches the API
over the compose network (`http://backend:4000`).

```bash
cd /root/Madoo-AI/apps/backend
git pull
docker compose up -d --build mcp
```

### HTTPS (required by Claude & ChatGPT)

Remote connectors require `https`. Terminate TLS at nginx and proxy to the container:

```nginx
server {
  server_name mcp.madoo.ai;
  location / {
    proxy_pass http://127.0.0.1:4100;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;          # stream MCP responses
    proxy_read_timeout 300s;
  }
  listen 443 ssl;                 # certbot fills cert lines
}
```

Then `certbot --nginx -d mcp.madoo.ai`.

## Connect a client

- **Claude** (web/desktop): Settings → Connectors → Add custom connector → `https://mcp.madoo.ai/mcp`
- **ChatGPT** (Developer Mode / connectors): Add MCP server → `https://mcp.madoo.ai/mcp`

## Env

See `.env.example`. Key vars: `MADOO_API_URL`, `MADOO_WEB_URL`, `MADOO_SERVICE_TOKEN`
(must match backend), optional `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` for the bridge tool.
