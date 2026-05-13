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
  createdAt: z.string(),
  updatedAt: z.string(),
  variants: z.array(EmailVariantDtoSchema),
});

export type EmailDto = z.infer<typeof EmailDtoSchema>;

export const EditEmailSchema = z.object({
  instruction: z.string().min(1),
  /** Optional: pin edits to a variant's React code as baseline */
  baseVariantId: z.string().optional(),
});

export type EditEmailInput = z.infer<typeof EditEmailSchema>;

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
