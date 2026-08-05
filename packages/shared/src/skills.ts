import { z } from "zod";

/**
 * Design skills the user can attach to a prompt from the composer.
 *
 * A skill is an opt-in design recipe (an advanced layout technique, or a
 * curated font pairing) that the backend normally exposes to the model as a
 * tool it may choose to fetch. Picking skills here changes that: the full
 * recipe is loaded into the very first request and the model is told to apply
 * it, so the user gets the technique they asked for without depending on the
 * model deciding to reach for it.
 */
export const SkillKindSchema = z.enum(["technique", "font"]);
export type SkillKind = z.infer<typeof SkillKindSchema>;

export const SkillDtoSchema = z.object({
  /** Stable id sent back on generate/edit. */
  name: z.string(),
  kind: SkillKindSchema,
  /** Short human label for the picker row. */
  label: z.string(),
  /** One-line description shown under the label. */
  summary: z.string(),
});
export type SkillDto = z.infer<typeof SkillDtoSchema>;

export const SkillListSchema = z.array(SkillDtoSchema);

/**
 * Skill ids attached to one generate/edit turn. Capped: each skill costs a
 * full recipe in the prompt, and stacking many produces a muddled email
 * instead of a designed one.
 */
export const MAX_PROMPT_SKILLS = 3;

export const PromptSkillsSchema = z
  .array(z.string().min(1))
  .max(MAX_PROMPT_SKILLS)
  .optional();
