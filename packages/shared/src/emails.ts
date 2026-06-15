import { z } from "zod";

const JsIdentifierSchema = z
  .string()
  .min(1)
  .regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/, "Variable name must be a valid JS identifier.");

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

function normalizeVariableRole(role: unknown, type?: string): VariableRole | undefined {
  const value = typeof role === "string" ? role.trim().toLowerCase() : "";
  if (value === "text" || value === "url" || value === "image" || value === "date") {
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

export const CreateEmailSchema = z.object({
  prompt: z.string().min(1),
  tone: z.string().optional(),
  length: z.string().optional(),
  audience: z.string().optional(),
  templateId: z.string().optional(),
  /** Resolves to workspace Template row when templateId is omitted */
  templateSlug: TemplateSlugSchema.optional(),
});

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
  tone: z.string().nullable(),
  length: z.string().nullable(),
  audience: z.string().nullable(),
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
  kind: z.enum(["TEXT", "THINKING", "STATUS"]),
  content: z.string(),
  createdAt: z.string().datetime(),
});

export type EmailChatMessageDto = z.infer<typeof EmailChatMessageDtoSchema>;

export const EditEmailSchema = z.object({
  instruction: z.string().min(1),
  /** Optional: pin edits to a variant's React code as baseline */
  baseVariantId: z.string().optional(),
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

export type TemplateSeedPreviewDto = z.infer<typeof TemplateSeedPreviewDtoSchema>;

export const CreateEmailFromTemplateSchema = z.object({
  templateSlug: TemplateSlugSchema,
  prompt: z.string().min(1),
  tone: z.string().optional(),
  length: z.string().optional(),
  audience: z.string().optional(),
});

export type CreateEmailFromTemplateInput = z.infer<typeof CreateEmailFromTemplateSchema>;
