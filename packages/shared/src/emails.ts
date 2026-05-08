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
});

/** Backward-compatible parser for older key/type payloads emitted by earlier prompts. */
const LegacyVariableSpecSchema = z.object({
  key: z.string().min(1),
  label: z.string().optional(),
  type: z.enum(["string", "number", "boolean", "url"]).optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
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

export function parseVariableSchemaJson(raw: unknown): VariableSchemaRoot {
  const parsed = z
    .union([
      z.object({
        variables: z.array(z.union([VariableSpecSchema, LegacyVariableSpecSchema])),
      }),
      z.array(z.union([VariableSpecSchema, LegacyVariableSpecSchema])),
    ])
    .parse(raw);
  const entries = Array.isArray(parsed) ? parsed : parsed.variables;
  return {
    variables: entries.map((entry) => {
      if ("name" in entry) return VariableSpecSchema.parse(entry);
      return VariableSpecSchema.parse({
        name: normalizeLegacyName(entry.key),
        label: entry.label ?? entry.description ?? entry.key,
        default: "",
        role: entry.type === "url" ? "url" : "text",
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
