import { z } from "zod";

/**
 * Visual editor contract (Phase 1).
 *
 * The backend compiles a variant's TSX with a tagging pass that stamps every
 * selectable JSX element with `data-m-id` (its `line:column` position in the
 * stored componentCode). The client lets the user click those elements inside
 * the preview iframe and sends surgical ops back; the backend patches the TSX
 * AST, recompiles, and saves the result as a new variant — the TSX stays the
 * single source of truth.
 */

/** Attribute carrying the JSX node id (`line:column` in the stored TSX). */
export const VISUAL_EDIT_ID_ATTR = "data-m-id";
/** Attribute marking elements whose text is directly editable: `literal` or `var:<name>`. */
export const VISUAL_EDIT_TEXT_ATTR = "data-m-text";
/**
 * Attribute marking elements rendered inside dynamic JSX (`.map`, ternaries).
 * They can be targeted for AI edits but not manipulated directly.
 */
export const VISUAL_EDIT_DYNAMIC_ATTR = "data-m-dynamic";

export const VisualEditNodeIdSchema = z
  .string()
  .regex(/^\d+:\d+$/, "Node id must be a line:column position.");

export type VisualEditNodeId = z.infer<typeof VisualEditNodeIdSchema>;

/**
 * CSS properties the manual style panel may edit. Email-safe subset only:
 * no positioning, floats, or layout primitives that email clients ignore.
 * Keys are the camelCase React style-object names — they map 1:1 onto the
 * `style={{ … }}` props the generated TSX already uses.
 */
export const VISUAL_EDIT_STYLE_PROPERTIES = [
  // Typography
  "color",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textTransform",
  "textDecoration",
  // Fill & border
  "backgroundColor",
  "borderRadius",
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius",
  "border",
  "borderWidth",
  "borderStyle",
  "borderColor",
  // Spacing
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  // Sizing
  "width",
  "maxWidth",
  "height",
] as const;

export type VisualEditStyleProperty =
  (typeof VISUAL_EDIT_STYLE_PROPERTIES)[number];

/**
 * A style value must stay a plain CSS token list: colors, lengths, keywords,
 * font stacks. Everything that could smuggle markup or external requests out
 * of a value position (`url(…)`, `expression(…)`, semicolons, braces, angle
 * brackets, `@`, backslashes) is rejected — values land inside the stored TSX
 * and the exported HTML.
 */
const STYLE_VALUE_SAFE_RE = /^[a-zA-Z0-9#%.,()\s'"\/*+-]*$/;
const STYLE_VALUE_BLOCKED_RE = /url\s*\(|expression\s*\(|javascript|@|\\|\/\*/i;

export const VisualEditStyleValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .refine(
    (value) =>
      STYLE_VALUE_SAFE_RE.test(value) && !STYLE_VALUE_BLOCKED_RE.test(value),
    { message: "Style value contains unsupported characters." },
  );

/** Map of property → new value, or null to remove the explicit property. */
export const VisualEditStylePatchSchema = z
  .record(
    z.enum(VISUAL_EDIT_STYLE_PROPERTIES),
    VisualEditStyleValueSchema.nullable(),
  )
  .refine((styles) => Object.keys(styles).length > 0, {
    message: "At least one style property is required.",
  })
  .refine((styles) => Object.keys(styles).length <= 24, {
    message: "Too many style properties in one op.",
  });

export type VisualEditStylePatch = z.infer<typeof VisualEditStylePatchSchema>;

export const VisualEditOpSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("setStyle"),
    nodeId: VisualEditNodeIdSchema,
    styles: VisualEditStylePatchSchema,
  }),
  z.object({
    op: z.literal("setText"),
    nodeId: VisualEditNodeIdSchema,
    text: z.string().max(4000),
  }),
  z.object({
    op: z.literal("setImage"),
    nodeId: VisualEditNodeIdSchema,
    url: z
      .string()
      .url()
      .max(4096)
      .refine((value) => /^https?:\/\//i.test(value), {
        message: "Image URL must use HTTP or HTTPS.",
      }),
  }),
  z.object({
    op: z.literal("setHref"),
    nodeId: VisualEditNodeIdSchema,
    /**
     * Link destination. `http(s)` for normal links plus `mailto:`/`tel:` for
     * contact CTAs. Everything else — notably `javascript:` and `data:` — is
     * rejected: the value lands in the stored TSX and the exported HTML.
     */
    url: z
      .string()
      .trim()
      .min(1)
      .max(4096)
      .refine((value) => /^(https?:\/\/|mailto:|tel:)/i.test(value), {
        message: "Link must start with http://, https://, mailto: or tel:.",
      })
      .refine((value) => !/[\s<>"']/.test(value), {
        message: "Link contains unsupported characters.",
      }),
  }),
  z.object({
    op: z.literal("delete"),
    nodeId: VisualEditNodeIdSchema,
  }),
  z.object({
    op: z.literal("move"),
    nodeId: VisualEditNodeIdSchema,
    /** Swap with the previous/next sibling element in the JSX tree. */
    direction: z.enum(["up", "down"]),
  }),
  z.object({
    op: z.literal("moveTo"),
    nodeId: VisualEditNodeIdSchema,
    /** Element the dragged node is dropped next to (may be in another container). */
    targetId: VisualEditNodeIdSchema,
    position: z.enum(["before", "after"]),
  }),
]);

export type VisualEditOp = z.infer<typeof VisualEditOpSchema>;

export const ApplyVisualEditSchema = z.object({
  /** Variant whose componentCode the node ids were computed against. */
  baseVariantId: z.string().min(1),
  ops: z.array(VisualEditOpSchema).min(1).max(100),
});

export type ApplyVisualEditInput = z.infer<typeof ApplyVisualEditSchema>;

/** Tagged, render-ready HTML for the visual editor surface. Never sent/exported. */
export const EditableEmailHtmlDtoSchema = z.object({
  variantId: z.string(),
  html: z.string(),
});

export type EditableEmailHtmlDto = z.infer<typeof EditableEmailHtmlDtoSchema>;

/** Element the user picked in the preview, attached to an AI edit turn. */
export const SelectedEmailElementSchema = z.object({
  nodeId: VisualEditNodeIdSchema,
  /** Human label shown in the chat chip, e.g. `<Heading>`. */
  label: z.string().trim().min(1).max(120),
});

export type SelectedEmailElement = z.infer<typeof SelectedEmailElementSchema>;
