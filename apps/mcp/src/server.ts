import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { config } from "./config.js";
import { isGate, madoo } from "./madoo.js";
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
        "link the user can open, plus a link to keep editing it in Madoo. The first couple of " +
        "emails in a conversation are free; after that the user is asked to create a free Madoo account.",
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
        continuationToken: z
          .string()
          .optional()
          .describe(
            "The continuationToken returned by the previous generate_email call in this " +
              "conversation. Always pass it back so the user's free allowance is tracked correctly.",
          ),
      },
      outputSchema: {
        requiresSignIn: z.boolean().optional(),
        signInUrl: z.string().optional(),
        previewUrl: z.string().optional(),
        editUrl: z.string().optional(),
        subject: z.string().optional(),
        continuationToken: z.string().optional(),
        freeRemaining: z.number().optional(),
      },
    },
    async ({ brief, brandName, brandUrl, continuationToken }) => {
      const result = await madoo.generateAnonymous({
        brief,
        brandName,
        brandUrl,
        continuationToken,
      });

      if (isGate(result)) {
        return {
          content: [
            {
              type: "text",
              text: [
                result.message,
                "",
                `**Create your free account:** ${result.signInUrl}`,
                "",
                "Tell the user to open that link — signing in keeps the emails already generated and unlocks editing and sending.",
              ].join("\n"),
            },
          ],
          structuredContent: {
            requiresSignIn: true,
            signInUrl: result.signInUrl,
          },
        };
      }

      const lines = [
        result.subject ? `**Subject:** ${result.subject}` : null,
        `**Preview:** ${result.previewUrl}`,
        `**Edit in Madoo:** ${result.ctaUrl}`,
        "",
        "Open the preview to view the email. Use the edit link to customize, add your brand, and send.",
        result.freeRemaining === 0
          ? `\nThat was the last free email in this chat. Create a free Madoo account to keep generating: ${result.signInUrl}`
          : `\n${result.freeRemaining} free email${result.freeRemaining === 1 ? "" : "s"} left in this chat.`,
      ].filter(Boolean);

      return {
        content: [{ type: "text", text: lines.join("\n") }],
        structuredContent: {
          previewUrl: result.previewUrl,
          editUrl: result.ctaUrl,
          subject: result.subject ?? undefined,
          continuationToken: result.continuationToken,
          freeRemaining: result.freeRemaining,
          signInUrl: result.signInUrl,
        },
      };
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
