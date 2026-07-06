import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const EMIT_EMAIL_TOOL: Tool = {
  name: "emit_email",
  description:
    "Return the final email as structured data: subject line, full TSX Madoo email component source with default export, and merge-field schema.",
  input_schema: {
    type: "object",
    properties: {
      subject: {
        type: "string",
        description:
          "Recipient-facing email subject only, aligned with the user brief. Never mention environment variables, .env, API keys, secrets, or deployment/infrastructure setup.",
      },
      componentCode: {
        type: "string",
        description:
          "Complete TSX file body for Madoo. Must export default function.",
      },
      variableSchema: {
        type: "array",
        description:
          "Array of merge-field specs: { name, label?, default, role?, scope }. scope must be 'dynamic' or 'static'. Keep it small and only include meaningful fields.",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                "Camel-case variable name used as the React prop, for example recipientName or ctaUrl.",
            },
            label: { type: "string" },
            default: { type: "string" },
            role: {
              type: "string",
              enum: ["text", "url", "image", "date"],
              description:
                "Data type only. Do not put variable identity values like recipient_name here.",
            },
            scope: {
              type: "string",
              enum: ["dynamic", "static"],
            },
          },
          required: ["name", "default", "scope"],
          additionalProperties: false,
        },
      },
    },
    required: ["subject", "componentCode", "variableSchema"],
  },
};

export const INSPECT_WEBSITE_BRAND_TOOL: Tool = {
  name: "inspect_website_brand",
  description:
    "Inspect a public website and return compact brand context for email creation: brand name, copy snippets, CTAs, colors, fonts, logo URL, favicon URL, OpenGraph image URL, and useful image URLs. Never returns image bytes.",
  input_schema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description:
          "Public website URL to inspect. Use the official brand/product site when provided by the user.",
      },
      purpose: {
        type: "string",
        description:
          "Why this website context is needed, e.g. product launch email, newsletter, welcome email, or promotion template.",
      },
    },
    required: ["url"],
  },
};

export const FIND_IMAGES_TOOL: Tool = {
  name: "find_images",
  description:
    "Search the web for real, publicly-hosted images and return direct image URLs (with short descriptions). Use this when the user asks to find, add, or pick an image/photo/illustration from the internet (e.g. 'find a good protein image', 'add a product photo') and no suitable attached image or brand image URL exists. Pick the most relevant returned URL and use it as the <Img src> default. Never invent image URLs — call this tool instead.",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "Concise visual search query, e.g. 'protein powder scoop', 'healthy breakfast bowl', 'modern office team'.",
      },
    },
    required: ["query"],
  },
};

export const FIND_BRAND_IMAGES_TOOL: Tool = {
  name: "find_brand_images",
  description:
    "Find images belonging to a specific brand/website the user referenced, including products, lifestyle shots, and banners. Prefer this over find_images whenever a brand URL is known.",
  input_schema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "Brand site URL.",
      },
      query: {
        type: "string",
        description:
          "Optional image intent, e.g. 'new arrivals product shots' or 'lifestyle banner'.",
      },
    },
    required: ["url"],
  },
};

export const GET_EMAIL_VERSION_TOOL: Tool = {
  name: "get_email_version",
  description:
    "Fetch the full TSX componentCode and variableSchema of a previously saved version of THIS email by its version number. Every save creates a numbered version; the user sees them as 'Version N · latest'. You normally only receive the CURRENT version's code. Call this whenever the user asks to revert, restore, undo back to, or reuse anything from an earlier version (e.g. 'put the image back as it was in version 1', 'go back to version 2', 'revert to the previous one'). Read the exact earlier code with this tool, then emit_email with the reverted or merged result. Never reconstruct an old version from memory.",
  input_schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        description:
          "The 1-based version number to fetch — the same number shown to the user (1, 2, 3, …).",
      },
    },
    required: ["version"],
  },
};

export const VIEW_CURRENT_EMAIL_TOOL: Tool = {
  name: "view_current_email",
  description:
    "Render the email and return a screenshot image so you can SEE the current visual result. Call this when the user complains about how the email looks ('looks off', 'too cramped', 'ugly'), when matching an attached reference image, before a major visual redesign, or after several accumulated layout edits. Do NOT call it on every turn or for pure copy changes. Optionally pass a version number to view an earlier saved version.",
  input_schema: {
    type: "object",
    properties: {
      version: {
        type: "number",
        description:
          "Optional 1-based saved version number. Omit for the current/latest version.",
      },
    },
  },
};

export const GENERATE_CHART_TOOL: Tool = {
  name: "generate_chart",
  description:
    "Render a data chart as a static PNG image (hosted on our CDN) and return its URL for use as an <Img src>. Email clients cannot run JS/SVG, so charts MUST be images — call this whenever the user asks for a chart, graph, plot, or data visualization (revenue bars, growth line, breakdown pie/doughnut, etc.). Use brand colors. Return the URL as the <Img src> default with an explicit width and descriptive alt text.",
  input_schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["bar", "line", "pie", "doughnut", "radar", "polarArea"],
        description: "Chart type.",
      },
      title: { type: "string", description: "Optional chart title." },
      labels: {
        type: "array",
        items: { type: "string" },
        description: "X-axis / slice labels, e.g. ['Jan','Feb','Mar'].",
      },
      datasets: {
        type: "array",
        description:
          "One or more series. For pie/doughnut/polarArea use a single dataset; its values map to the labels.",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Series name (legend)." },
            data: {
              type: "array",
              items: { type: "number" },
              description: "Numeric values, one per label.",
            },
            colors: {
              type: "array",
              items: { type: "string" },
              description:
                "Hex colors. For bar/line, the first color is used for the series. For pie/doughnut/polarArea, one color per slice (per label).",
            },
          },
          required: ["data"],
        },
      },
      width: { type: "number", description: "Image width px (default 560)." },
      height: { type: "number", description: "Image height px (default 300)." },
    },
    required: ["type", "labels", "datasets"],
  },
};

export type ChartToolInput = {
  type: "bar" | "line" | "pie" | "doughnut" | "radar" | "polarArea";
  title?: string;
  labels?: string[];
  datasets?: Array<{ label?: string; data: number[]; colors?: string[] }>;
  width?: number;
  height?: number;
};

export const CHART_PALETTE = [
  "#0D0D0D",
  "#2f6fea",
  "#16a34a",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#cccccc",
];

/** Build a QuickChart.io PNG URL from the structured chart tool input. */
export function buildQuickChartUrl(input: ChartToolInput): string {
  const isPie =
    input.type === "pie" ||
    input.type === "doughnut" ||
    input.type === "polarArea";
  const datasets = (input.datasets ?? []).map((ds, i) => {
    const colors = ds.colors && ds.colors.length > 0 ? ds.colors : CHART_PALETTE;
    if (isPie) {
      return { label: ds.label, data: ds.data, backgroundColor: colors };
    }
    if (input.type === "line") {
      return {
        label: ds.label,
        data: ds.data,
        borderColor: colors[0] ?? CHART_PALETTE[i % CHART_PALETTE.length],
        backgroundColor: colors[0] ?? CHART_PALETTE[i % CHART_PALETTE.length],
        fill: false,
      };
    }
    return {
      label: ds.label,
      data: ds.data,
      backgroundColor: colors[0] ?? CHART_PALETTE[i % CHART_PALETTE.length],
    };
  });

  const config = {
    type: input.type,
    data: { labels: input.labels ?? [], datasets },
    options: input.title
      ? { title: { display: true, text: input.title } }
      : {},
  };

  const params = new URLSearchParams({
    w: String(Math.min(Math.max(input.width ?? 560, 120), 1200)),
    h: String(Math.min(Math.max(input.height ?? 300, 120), 800)),
    bkg: "white",
    c: JSON.stringify(config),
  });
  return `https://quickchart.io/chart?${params.toString()}`;
}
