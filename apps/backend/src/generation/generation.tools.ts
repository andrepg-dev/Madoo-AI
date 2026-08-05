import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { EMAIL_ICON_NAMES } from "./email-icon-catalog.service";
import { DESIGN_TECHNIQUE_NAMES } from "./design-techniques";
import { FONT_PAIRING_NAMES } from "./font-pairings";
import { DIVIDER_SHAPES } from "./section-divider";

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

export const GET_EMAIL_ICONS_TOOL: Tool = {
  name: "get_email_icons",
  description:
    "Return stable, email-safe PNG URLs from Madoo's curated icon catalog. Use for compact feature rows, benefits, contact details, commerce, trust marks, and social links. Do not use icons as hero imagery or as a substitute for meaningful photos.",
  input_schema: {
    type: "object",
    properties: {
      names: {
        type: "array",
        minItems: 1,
        maxItems: 8,
        uniqueItems: true,
        items: { type: "string", enum: [...EMAIL_ICON_NAMES] },
        description: "One to eight icon names from the curated catalog.",
      },
      tone: {
        type: "string",
        enum: ["dark", "light"],
        description:
          "Use dark icons on light surfaces and light icons on dark/accent surfaces.",
      },
    },
    required: ["names", "tone"],
  },
};

export const GET_DESIGN_TECHNIQUE_TOOL: Tool = {
  name: "get_design_technique",
  description:
    "Fetch the full recipe for one of Madoo's advanced email design techniques: when it fits, a copy-pasteable email-safe code pattern, its rules, and how it degrades in Outlook. Call this BEFORE writing the code whenever the brief, the brand, or an attached reference image calls for one of the catalogued techniques — the base instructions only list their names. These are opt-in moves for a minority of briefs, so do not fetch one on every email and never apply a technique you have not fetched.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        enum: [...DESIGN_TECHNIQUE_NAMES],
        description: "Technique id from the design technique index.",
      },
    },
    required: ["name"],
  },
};

export const GET_FONT_PAIRING_TOOL: Tool = {
  name: "get_font_pairing",
  description:
    "Fetch a curated font pairing with VERIFIED Google Fonts woff2 URLs, ready-to-paste <Font> tags, a fallback stack, and typographic guidance. Call this before writing the email whenever it should use web fonts — the URLs cannot be guessed, and an invented one fails silently (the email just renders in the fallback). Pick the pairing whose personality matches the brand and brief.",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        enum: [...FONT_PAIRING_NAMES],
        description: "Pairing id from the font pairing index.",
      },
    },
    required: ["name"],
  },
};

export const GENERATE_SECTION_DIVIDER_TOOL: Tool = {
  name: "generate_section_divider",
  description:
    "Render a shaped boundary between two colored sections (wave, tilt, dome) as a hosted PNG and return its URL for use as a full-bleed <Img>. Email clients cannot draw these shapes: SVG is stripped, clip-path is unsupported, and CSS border-radius can only make a symmetric dome that reads as a plain rounded corner. Call this whenever an email needs a curved or angled section transition. The PNG contains BOTH colors, so it drops in between the two sections with no transparency and no seam.",
  input_schema: {
    type: "object",
    properties: {
      shape: {
        type: "string",
        enum: [...DIVIDER_SHAPES],
        description:
          "wave = asymmetric editorial S-curve (the modern default); wave-soft = one shallow swell; arc = symmetric dome; slant = straight diagonal.",
      },
      topColor: {
        type: "string",
        description:
          "Hex color of the section ABOVE the divider, e.g. '#FFFFFF'. Must match that section's background exactly. Pass 'transparent' when the band above is a photo, a gradient, or any background whose color you cannot name — the PNG then carries an alpha channel instead.",
      },
      bottomColor: {
        type: "string",
        description:
          "Hex color of the section BELOW the divider, e.g. '#8B85D9', or 'transparent'. At least one of the two bands must be a real color.",
      },
      height: {
        type: "number",
        description:
          "Rendered height in px at 2x. 90-160 reads well; taller becomes a design element of its own.",
      },
      flip: {
        type: "boolean",
        description:
          "Mirror the shape horizontally. Use so a section's entry and exit dividers are not identical.",
      },
    },
    required: ["shape", "topColor", "bottomColor"],
  },
};

export const GET_EMAIL_VERSION_TOOL: Tool = {
  name: "get_email_version",
  description:
    "Fetch full TSX and variableSchema for a retained version of THIS email. The user sees numbered versions as 'Version N · latest'; only newest 20 are retained. Current edit prompt gives exact retained range. Call this for revert, restore, undo, or reuse requests, then emit_email with exact retrieved code. Never reconstruct old versions from memory.",
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
          "Optional retained saved version number. Omit for current/latest version.",
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
