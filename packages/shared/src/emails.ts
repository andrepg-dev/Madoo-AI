import { z } from "zod";
import { PromptSkillsSchema } from "./skills";
import { SelectedEmailElementSchema } from "./visual-edit";

const JsIdentifierSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
    "Variable name must be a valid JS identifier.",
  );

/** Variable schema expected by Phase 1 contract (name/default/role). */
export const VariableSpecSchema = z.object({
  name: JsIdentifierSchema,
  label: z.string().optional(),
  default: z.string(),
  role: z.enum(["text", "url", "image", "date"]).optional(),
  scope: z.enum(["dynamic", "static"]).default("dynamic"),
});
type VariableRole = NonNullable<z.infer<typeof VariableSpecSchema>["role"]>;

const RawVariableSpecSchema = z
  .object({
    name: z.string().min(1).optional(),
    key: z.string().min(1).optional(),
    label: z.string().optional(),
    default: z.unknown().optional(),
    role: z.unknown().optional(),
    type: z.enum(["string", "number", "boolean", "url"]).optional(),
    description: z.string().optional(),
    required: z.boolean().optional(),
    scope: z.enum(["dynamic", "static"]).optional(),
  })
  .passthrough()
  .refine((entry) => entry.name || entry.key, {
    message: "Variable must include name or key.",
  });

export const VariableSchemaRootSchema = z.object({
  variables: z.array(VariableSpecSchema),
});

export type VariableSpec = z.infer<typeof VariableSpecSchema>;
export type VariableSchemaRoot = { variables: VariableSpec[] };

function normalizeLegacyName(name: string): string {
  const safe = name
    .trim()
    .replace(/[^a-zA-Z0-9_$]+/g, " ")
    .split(" ")
    .filter(Boolean);
  if (safe.length === 0) return "value";
  const [first, ...rest] = safe;
  const camel = `${first.toLowerCase()}${rest
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("")}`;
  const prefixed = /^[a-zA-Z_$]/.test(camel) ? camel : `v${camel}`;
  return prefixed.replace(/[^a-zA-Z0-9_$]/g, "");
}

function normalizeVariableName(name: string): string {
  const trimmed = name.trim();
  return JsIdentifierSchema.safeParse(trimmed).success
    ? trimmed
    : normalizeLegacyName(trimmed);
}

function stringifyDefault(value: unknown): string {
  if (value === undefined || value === null) return "";
  return typeof value === "string" ? value : String(value);
}

function normalizeVariableRole(
  role: unknown,
  type?: string,
): VariableRole | undefined {
  const value = typeof role === "string" ? role.trim().toLowerCase() : "";
  if (
    value === "text" ||
    value === "url" ||
    value === "image" ||
    value === "date"
  ) {
    return value;
  }

  const hint = value || type || "";
  if (!hint) return undefined;
  if (/url|link|href/.test(hint)) return "url";
  if (/image|photo|picture|avatar|logo/.test(hint)) return "image";
  if (/date|time|day|deadline/.test(hint)) return "date";
  return "text";
}

export function parseVariableSchemaJson(raw: unknown): VariableSchemaRoot {
  const parsed = z
    .union([
      z.object({
        variables: z.array(RawVariableSpecSchema),
      }),
      z.array(RawVariableSpecSchema),
    ])
    .parse(raw);
  const entries = Array.isArray(parsed) ? parsed : parsed.variables;
  return {
    variables: entries.map((entry) => {
      if ("name" in entry && entry.name) {
        return VariableSpecSchema.parse({
          name: normalizeVariableName(entry.name),
          label: entry.label,
          default: stringifyDefault(entry.default),
          role: normalizeVariableRole(entry.role, entry.type),
          scope: entry.scope ?? "dynamic",
        });
      }
      return VariableSpecSchema.parse({
        name: normalizeLegacyName(entry.key ?? "value"),
        label: entry.label ?? entry.description ?? entry.key,
        default: stringifyDefault(entry.default),
        role: normalizeVariableRole(entry.role, entry.type) ?? "text",
        scope: "dynamic",
      });
    }),
  };
}

/**
 * Values passed to the renderer: static variables use their fixed default,
 * dynamic variables render as a `{{name}}` merge tag (replaced per-recipient
 * outside Madoo). The preview highlights these tags so they're easy to spot.
 */
export function buildRenderVariables(
  schema: VariableSchemaRoot,
): Record<string, string> {
  return Object.fromEntries(
    schema.variables.map((variable) => [
      variable.name,
      variable.scope === "static" ? variable.default : `{{${variable.name}}}`,
    ]),
  );
}

function humanizeVariableName(name: string): string {
  const spaced = name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_$]+/g, " ")
    .trim();
  if (!spaced) return name;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Splits a destructuring block (`a = '1', b = "2"`) into top-level `name = value`
 * entries, respecting string literals so commas inside defaults don't split.
 */
function splitTopLevelProps(block: string): string[] {
  const entries: string[] = [];
  let current = "";
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < block.length; i += 1) {
    const char = block[i];
    if (quote) {
      current += char;
      if (char === "\\") {
        current += block[i + 1] ?? "";
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(" || char === "{" || char === "[") depth += 1;
    if (char === ")" || char === "}" || char === "]") depth -= 1;
    if (char === "," && depth === 0) {
      entries.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) entries.push(current);
  return entries;
}

function parseStringLiteral(value: string): string | null {
  const trimmed = value.trim();
  const quote = trimmed[0];
  if (quote !== "'" && quote !== '"' && quote !== "`") return null;
  if (trimmed[trimmed.length - 1] !== quote) return null;
  return trimmed
    .slice(1, -1)
    .replace(/\\(['"`\\])/g, "$1")
    .replace(/\\n/g, "\n");
}

/**
 * Fallback variable extraction for templates that have no stored schema (seeds).
 * Reads the `Email = ({ name = 'default', ... } = {}) =>` destructured props and
 * maps each string default to a `static` variable so the rendered output is
 * unchanged while the values become editable. Roles are inferred from the name.
 */
export function extractVariableSchemaFromComponent(
  componentCode: string,
): VariableSchemaRoot {
  const match = componentCode.match(
    /\(\s*\{([\s\S]*?)\}\s*(?:=\s*\{\}\s*)?\)\s*=>/,
  );
  if (!match) return { variables: [] };
  const variables: VariableSpec[] = [];
  const seen = new Set<string>();
  for (const entry of splitTopLevelProps(match[1])) {
    const eq = entry.indexOf("=");
    if (eq === -1) continue;
    const rawName = entry.slice(0, eq).trim();
    if (!JsIdentifierSchema.safeParse(rawName).success || seen.has(rawName))
      continue;
    const defaultValue = parseStringLiteral(entry.slice(eq + 1));
    if (defaultValue === null) continue;
    seen.add(rawName);
    variables.push(
      VariableSpecSchema.parse({
        name: rawName,
        label: humanizeVariableName(rawName),
        default: defaultValue,
        role: normalizeVariableRole(rawName) ?? "text",
        scope: "static",
      }),
    );
  }
  return { variables };
}

/**
 * Re-applies user-set variable values on the schema emitted after an AI edit.
 * Values changed via the variables panel live only in the variant's stored
 * schema — the component code keeps its original defaults, so the model tends
 * to re-emit those and silently discard the user's value (e.g. an uploaded
 * logo). A user override is carried into the new schema unless the model
 * deliberately emitted a new value of its own (different from both the old
 * code default and the user's value).
 */
export function mergeUserVariableOverrides(
  emitted: VariableSchemaRoot,
  baseComponentCode: string,
  baseVariableSchema: unknown,
): VariableSchemaRoot {
  let userSchema: VariableSchemaRoot;
  try {
    userSchema = parseVariableSchemaJson(baseVariableSchema);
  } catch {
    return emitted;
  }
  const codeDefaults = new Map(
    extractVariableSchemaFromComponent(baseComponentCode).variables.map(
      (variable) => [variable.name, variable.default],
    ),
  );
  const userVariables = new Map(
    userSchema.variables.map((variable) => [variable.name, variable]),
  );
  return {
    variables: emitted.variables.map((variable) => {
      const user = userVariables.get(variable.name);
      if (!user) return variable;
      const codeDefault = codeDefaults.get(variable.name);
      const userOverrode =
        codeDefault !== undefined && user.default !== codeDefault;
      if (!userOverrode) return variable;
      const modelChangedIntentionally =
        variable.default.trim() !== "" &&
        variable.default !== codeDefault &&
        variable.default !== user.default;
      if (modelChangedIntentionally) return variable;
      return { ...variable, default: user.default, scope: user.scope };
    }),
  };
}

export const TemplateSlugSchema = z.enum([
  "launch",
  "newsletter",
  "sale",
  "welcome",
  "minimal",
  "event",
  "digest",
  "thanks",
  "feature",
  "survey",
  "reengage",
  "referral",
]);
export type TemplateSlug = z.infer<typeof TemplateSlugSchema>;

export const TemplateDtoSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TemplateDto = z.infer<typeof TemplateDtoSchema>;

export const TemplateListDtoSchema = z.array(TemplateDtoSchema);

export const SaveTemplateFromVariantSchema = z.object({
  variantId: z.string().min(1),
  name: z.string().min(1),
});

export type SaveTemplateFromVariantInput = z.infer<
  typeof SaveTemplateFromVariantSchema
>;

export const SavedTemplateDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export type SavedTemplateDto = z.infer<typeof SavedTemplateDtoSchema>;

/** Public S3 URLs of user-attached images, passed to the AI for vision and
 *  reuse as <Img src> inside the generated email. */
export const EmailImageUrlsSchema = z.array(z.string().url()).max(8).optional();

export const CreateEmailSchema = z.object({
  prompt: z.string().min(1),
  templateId: z.string().optional(),
  /** Resolves to workspace Template row when templateId is omitted */
  templateSlug: TemplateSlugSchema.optional(),
});

/** Body for POST /emails/:id/generate — optional image attachments. */
export const GenerateEmailSchema = z.object({
  /** Optional replacement prompt when a chat-only first turn did not create a variant yet. */
  prompt: z.string().min(1).optional(),
  imageUrls: EmailImageUrlsSchema,
  /** Design skills picked in the composer; loaded into the first request. */
  skills: PromptSkillsSchema,
});

export type GenerateEmailInput = z.infer<typeof GenerateEmailSchema>;

export type CreateEmailInput = z.infer<typeof CreateEmailSchema>;

export const EmailVariantDtoSchema = z.object({
  id: z.string(),
  seq: z.number(),
  subject: z.string(),
  componentCode: z.string(),
  compiledHtml: z.string(),
  variableSchema: VariableSchemaRootSchema,
  previewUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type EmailVariantDto = z.infer<typeof EmailVariantDtoSchema>;

export const EmailVisibilitySchema = z.enum(["PRIVATE", "PUBLIC"]);
export type EmailVisibility = z.infer<typeof EmailVisibilitySchema>;

export const EmailDtoSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  status: z.enum(["DRAFT", "GENERATING", "READY", "ERROR"]),
  prompt: z.string(),
  title: z.string().nullable(),
  templateId: z.string().nullable(),
  templateSavedAt: z.string().nullable(),
  visibility: EmailVisibilitySchema.default("PRIVATE"),
  publicId: z.string().nullable().default(null),
  starred: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  variants: z.array(EmailVariantDtoSchema),
});

export type EmailDto = z.infer<typeof EmailDtoSchema>;

export const EmailRatingInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export type EmailRatingInput = z.infer<typeof EmailRatingInputSchema>;

export const EmailRatingDtoSchema = z.object({
  id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  createdAt: z.string(),
});

export type EmailRatingDto = z.infer<typeof EmailRatingDtoSchema>;

/** Input for starring/unstarring a project. */
export const SetEmailStarredSchema = z.object({
  starred: z.boolean(),
});

export type SetEmailStarredInput = z.infer<typeof SetEmailStarredSchema>;

/** Input for toggling an email's share visibility (public/private link). */
export const UpdateEmailShareSchema = z.object({
  visibility: EmailVisibilitySchema,
});

export type UpdateEmailShareInput = z.infer<typeof UpdateEmailShareSchema>;

/** Share state returned after toggling visibility. */
export const EmailShareDtoSchema = z.object({
  id: z.string(),
  visibility: EmailVisibilitySchema,
  publicId: z.string().nullable(),
});

export type EmailShareDto = z.infer<typeof EmailShareDtoSchema>;

/** Read-only payload served on the public, unauthenticated share page. */
export const PublicEmailDtoSchema = z.object({
  publicId: z.string(),
  title: z.string().nullable(),
  subject: z.string(),
  compiledHtml: z.string(),
  createdAt: z.string(),
  /** Rendered template screenshot — used as the share page's OG image. */
  previewUrl: z.string().nullable(),
});

export type PublicEmailDto = z.infer<typeof PublicEmailDtoSchema>;

export const RenameEmailSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export type RenameEmailInput = z.infer<typeof RenameEmailSchema>;

export const TransferEmailSchema = z.object({
  targetWorkspaceId: z.string().min(1),
});

export type TransferEmailInput = z.infer<typeof TransferEmailSchema>;

export const EmailChatMessageDtoSchema = z.object({
  id: z.string(),
  role: z.enum(["USER", "ASSISTANT", "SYSTEM"]),
  kind: z.enum(["TEXT", "THINKING", "STATUS", "TOOL_CALL"]),
  content: z.string(),
  /** Public URLs of images the user attached to this turn. */
  imageUrls: z.array(z.string()).default([]),
  /** Design skill ids the user attached in the composer for this turn. */
  skills: z.array(z.string()).default([]),
  /** Label of the preview element the user had selected for this edit turn. */
  selectedElementLabel: z.string().nullable().optional(),
  feedback: z.enum(["LIKE", "DISLIKE"]).nullable().optional(),
  feedbackComment: z.string().nullable().optional(),
  /** Shared by assistant responses that are regenerations of the same turn. */
  groupId: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type EmailChatMessageDto = z.infer<typeof EmailChatMessageDtoSchema>;

export const EmailChatToolCallPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  detail: z.string().optional(),
  summary: z.string().optional(),
  images: z.array(z.string()).optional(),
});

export type EmailChatToolCallPayload = z.infer<
  typeof EmailChatToolCallPayloadSchema
>;

export const SetEmailChatMessageFeedbackSchema = z.object({
  feedback: z.enum(["LIKE", "DISLIKE"]).nullable(),
  comment: z.string().trim().max(2000).nullable().optional(),
});

export type SetEmailChatMessageFeedbackInput = z.infer<
  typeof SetEmailChatMessageFeedbackSchema
>;

export const EditEmailSchema = z.object({
  instruction: z.string().min(1),
  /** Optional: pin edits to a variant's React code as baseline */
  baseVariantId: z.string().optional(),
  /** Public S3 URLs of images attached to this edit turn (vision + reuse). */
  imageUrls: EmailImageUrlsSchema,
  /** Element picked in the visual editor so the AI edits exactly that node. */
  selectedElement: SelectedEmailElementSchema.optional(),
  /** Design skills picked in the composer; loaded into this request. */
  skills: PromptSkillsSchema,
});

export type EditEmailInput = z.infer<typeof EditEmailSchema>;

/** Response after uploading an image for an image-role variable. */
export const EmailImageUploadResponseSchema = z.object({
  url: z.string().url(),
});

export type EmailImageUploadResponse = z.infer<
  typeof EmailImageUploadResponseSchema
>;

/** Delete chat messages from `from` (inclusive) onward — used to edit a turn. */
export const TruncateEmailChatSchema = z.object({
  from: z.string().datetime(),
});

export type TruncateEmailChatInput = z.infer<typeof TruncateEmailChatSchema>;

export const UpdateEmailVariantVariableSchemaSchema = z.object({
  variableSchema: VariableSchemaRootSchema,
});

export type UpdateEmailVariantVariableSchemaInput = z.infer<
  typeof UpdateEmailVariantVariableSchemaSchema
>;

export const TemplateSeedPreviewDtoSchema = z.object({
  slug: TemplateSlugSchema,
  name: z.string(),
  componentCode: z.string(),
  compiledHtml: z.string(),
  variableSchema: VariableSchemaRootSchema,
});

export type TemplateSeedPreviewDto = z.infer<
  typeof TemplateSeedPreviewDtoSchema
>;

export const CreateEmailFromTemplateSchema = z.object({
  templateSlug: TemplateSlugSchema,
  prompt: z.string().min(1),
});

export type CreateEmailFromTemplateInput = z.infer<
  typeof CreateEmailFromTemplateSchema
>;

export const COMMUNITY_TEMPLATE_CATEGORIES = [
  "Promotional",
  "Newsletter",
  "Welcome",
  "Product Launch",
  "Announcement",
  "Transactional",
  "Abandoned Cart",
  "Confirmation",
  "Events & Webinars",
  "Seasonal / Holiday",
  "Survey & Feedback",
  "Re-engagement",
  "Referral",
  "Internal / HR",
  "Education / Tutorial",
  "Thank You",
  // E-commerce (Klaviyo / Stripo / Really Good Emails)
  "Order Confirmation",
  "Shipping & Delivery",
  "Receipt / Invoice",
  "Back in Stock",
  "Price Drop",
  "Browse Abandonment",
  "Post-Purchase",
  "Cross-sell / Upsell",
  "Loyalty & Rewards",
  "Birthday & Anniversary",
  "Sale / Flash Sale",
  "Review Request",
  "Other",
] as const;

export const COMMUNITY_TEMPLATE_MAX_CATEGORIES = 3;

export const CommunityTemplateCategorySchema = z.enum(
  COMMUNITY_TEMPLATE_CATEGORIES,
);
export type CommunityTemplateCategory = z.infer<
  typeof CommunityTemplateCategorySchema
>;

/** A template published to the global community gallery (list/card shape). */
export const CommunityTemplateDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  categories: z.array(CommunityTemplateCategorySchema).default([]),
  previewUrl: z.string().nullable(),
  variableSchema: VariableSchemaRootSchema,
  viewCount: z.number(),
  useCount: z.number(),
  authorName: z.string().nullable(),
  starred: z.boolean().default(false),
  /** True when the requesting user authored this template (can make it private). */
  owned: z.boolean().default(false),
  createdAt: z.string(),
});

export type CommunityTemplateDto = z.infer<typeof CommunityTemplateDtoSchema>;

export const CommunityTemplateListDtoSchema = z.array(
  CommunityTemplateDtoSchema,
);

/** Detail payload (adds source + compiled HTML) for the "use template" modal. */
export const CommunityTemplateDetailDtoSchema =
  CommunityTemplateDtoSchema.extend({
    componentCode: z.string(),
    compiledHtml: z.string(),
  });

export type CommunityTemplateDetailDto = z.infer<
  typeof CommunityTemplateDetailDtoSchema
>;

/** Input to publish one of the workspace's emails to the community gallery. */
export const ShareEmailToCommunitySchema = z.object({
  emailId: z.string().min(1),
  /** 1-based version (EmailVariant.seq) to publish; defaults to the latest. */
  variantSeq: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(280).optional().nullable(),
  category: z.string().trim().max(48).optional().nullable(),
  categories: z
    .array(CommunityTemplateCategorySchema)
    .min(1)
    .max(COMMUNITY_TEMPLATE_MAX_CATEGORIES),
});

export type ShareEmailToCommunityInput = z.infer<
  typeof ShareEmailToCommunitySchema
>;

/** Input to materialize a community template into an email (with edited values). */
export const UseCommunityTemplateSchema = z.object({
  variableSchema: VariableSchemaRootSchema,
});

export type UseCommunityTemplateInput = z.infer<
  typeof UseCommunityTemplateSchema
>;

export const SetCommunityTemplateStarredSchema = z.object({
  starred: z.boolean(),
});

export type SetCommunityTemplateStarredInput = z.infer<
  typeof SetCommunityTemplateStarredSchema
>;
