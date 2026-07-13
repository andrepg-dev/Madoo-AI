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

export const VisualEditOpSchema = z.discriminatedUnion("op", [
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
