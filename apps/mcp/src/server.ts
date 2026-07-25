import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "./config.js";
import { madoo } from "./madoo.js";
import { askModel, bridgeAvailable } from "./ask-model.js";

/**
 * Build a fresh MCP server instance with all Madoo tools registered.
 * A new instance is created per session by the HTTP transport layer.
 */
export function buildServer(): McpServer {
  const server = new McpServer(
    { name: "madoo", version: "0.0.1" },
    {
      instructions:
        "Madoo generates polished, ready-to-send marketing emails from a plain-language brief. " +
        "Use generate_email whenever the user wants an email, newsletter, promo, or announcement created. " +
        "Always show the returned preview link so the user can view and edit the result.",
    },
  );

  // --- Acquisition tool: anonymous email generation --------------------------
  server.registerTool(
    "generate_email",
    {
      title: "Generate a marketing email",
      description:
        "Generate a complete, styled HTML marketing email from a brief. Returns a public preview " +
        "link the user can open, plus a link to keep editing it in Madoo. No account required.",
      inputSchema: {
        brief: z
          .string()
          .min(5)
          .describe("What the email should say — product, offer, audience, goal, key points."),
        brandName: z.string().optional().describe("Brand or company name to feature."),
        brandUrl: z
          .string()
          .url()
          .optional()
          .describe("Brand website — Madoo pulls logo/colors from it when provided."),
        tone: z
          .string()
          .optional()
          .describe("Desired tone, e.g. 'friendly', 'urgent', 'premium'."),
      },
    },
    async ({ brief, brandName, brandUrl, tone }) => {
      const result = await madoo.generateAnonymous({ brief, brandName, brandUrl, tone });
      const lines = [
        result.subject ? `**Subject:** ${result.subject}` : null,
        `**Preview:** ${result.previewUrl}`,
        `**Edit in Madoo:** ${result.ctaUrl}`,
        "",
        "Open the preview to view the email. Use the edit link to customize, add your brand, and send.",
      ].filter(Boolean);
      return { content: [{ type: "text", text: lines.join("\n") }] };
    },
  );

  // --- Discovery tool: browse templates --------------------------------------
  server.registerTool(
    "list_email_templates",
    {
      title: "List Madoo email templates",
      description: "List available prebuilt email templates (name + slug) to start from.",
      inputSchema: {},
    },
    async () => {
      const templates = await madoo.listTemplates();
      if (templates.length === 0) {
        return { content: [{ type: "text", text: "No templates available." }] };
      }
      const text = templates
        .map((t) => `- **${t.name}** (\`${t.id}\`)${t.description ? ` — ${t.description}` : ""}`)
        .join("\n");
      return { content: [{ type: "text", text }] };
    },
  );

  // --- Bridge tool: ask another model (Claude / GPT) -------------------------
  if (bridgeAvailable()) {
    server.registerTool(
      "ask_model",
      {
        title: "Ask another AI model",
        description:
          "Send a prompt to a different LLM (Claude or GPT) and return its answer. " +
          "Useful for a second opinion or cross-model comparison.",
        inputSchema: {
          prompt: z.string().min(1).describe("The prompt/question to send."),
          model: z
            .enum(["claude", "gpt"])
            .describe("Which provider to route to."),
          system: z.string().optional().describe("Optional system instruction."),
        },
      },
      async ({ prompt, model, system }) => {
        const answer = await askModel({ prompt, model, system });
        return { content: [{ type: "text", text: answer }] };
      },
    );
  }

  return server;
}

export const serverMeta = { webUrl: config.madooWebUrl };
