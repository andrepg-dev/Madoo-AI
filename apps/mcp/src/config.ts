/** Runtime configuration, read once from the environment. */
export const config = {
  /** Port the MCP HTTP server listens on. */
  port: Number(process.env.MCP_PORT ?? 4100),

  /** Base URL of the Madoo backend API (no trailing slash), e.g. http://backend:4000/api/v1 */
  madooApiUrl: (process.env.MADOO_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, ""),

  /** Public web app base used to build shareable / signup CTA links. */
  madooWebUrl: (process.env.MADOO_WEB_URL ?? "https://app.madoo.ai").replace(/\/$/, ""),

  /** Shared secret the MCP presents to the backend's anonymous generate endpoint. */
  madooServiceToken: process.env.MADOO_SERVICE_TOKEN ?? "",

  /** Bridge model keys (optional — ask_model tool is disabled if a key is missing). */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",

  /** Attribution tag appended to signup CTA links for tracking MCP-sourced traffic. */
  utmSource: process.env.MCP_UTM_SOURCE ?? "mcp",
} as const;

export function requireServiceToken(): string {
  if (!config.madooServiceToken) {
    throw new Error("MADOO_SERVICE_TOKEN is not set — cannot call the backend anonymous endpoint.");
  }
  return config.madooServiceToken;
}
