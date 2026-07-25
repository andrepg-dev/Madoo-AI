import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { buildServer } from "./server.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Health check for the VPS / load balancer.
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "madoo-mcp" });
});

/**
 * Streamable HTTP MCP endpoint. Runs stateless: each request gets a fresh
 * server + transport, so any number of Claude / ChatGPT clients can connect
 * concurrently without shared session state. This is the transport both
 * Claude and ChatGPT remote connectors speak.
 */
app.post("/mcp", async (req, res) => {
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[mcp] request failed:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Stateless transport does not support server->client streaming over GET/DELETE.
const methodNotAllowed = (_req: express.Request, res: express.Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
};
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

app.listen(config.port, () => {
  console.log(`madoo-mcp listening on http://localhost:${config.port}/mcp`);
  console.log(`  -> backend: ${config.madooApiUrl}`);
});
