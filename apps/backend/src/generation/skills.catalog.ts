import type { SkillDto } from "@madoo/shared";
import { DESIGN_TECHNIQUES } from "./design-techniques";
import { FONT_PAIRINGS, renderFontPairing } from "./font-pairings";

/**
 * The composer's skill picker over the design catalogs.
 *
 * Same recipes the model can fetch mid-turn via get_design_technique /
 * get_font_pairing — the difference is who decides. A skill the user picked is
 * loaded into the first request and stated as a requirement, so it never
 * depends on the model choosing to reach for the tool.
 *
 * The teasers in both catalogs are written as "id — description" for the
 * system-prompt index. The picker wants a readable label instead, so drop the
 * id half and title-case the id itself: "arc_section_edge" -> "Arc section
 * edge".
 */
function humanizeId(name: string): string {
  const spaced = name.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function splitTeaser(teaser: string, name: string) {
  const [, ...rest] = teaser.split(" — ");
  const summary = rest.join(" — ").trim();
  return {
    label: humanizeId(name),
    summary: summary || teaser,
  };
}

export function listSkills(): SkillDto[] {
  return [
    ...DESIGN_TECHNIQUES.map((technique) => {
      const { label, summary } = splitTeaser(technique.teaser, technique.name);
      return {
        name: technique.name,
        kind: "technique" as const,
        label,
        summary,
      };
    }),
    ...FONT_PAIRINGS.map((pairing) => {
      const { label, summary } = splitTeaser(pairing.teaser, pairing.name);
      return {
        name: pairing.name,
        kind: "font" as const,
        label,
        summary,
      };
    }),
  ];
}

/** Full recipe text for one skill id, or null when the id is unknown. */
function skillDoc(name: string): string | null {
  const technique = DESIGN_TECHNIQUES.find((t) => t.name === name);
  if (technique) return technique.doc;
  const pairing = FONT_PAIRINGS.find((p) => p.name === name);
  if (pairing) return renderFontPairing(pairing);
  return null;
}

/**
 * Build the system block injected when the user picked skills in the composer.
 *
 * Returns null when nothing valid was picked — unknown ids are dropped rather
 * than rejected, so a stale client can never fail a generation.
 */
export function buildSkillPreamble(names: string[] | undefined): string | null {
  if (!names || names.length === 0) return null;

  const seen = new Set<string>();
  const sections: string[] = [];
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    const doc = skillDoc(name);
    if (doc) sections.push(doc);
  }
  if (sections.length === 0) return null;

  return [
    "USER-SELECTED DESIGN SKILLS — the user explicitly attached the following recipes to this request in the composer. Apply EVERY one of them to this email. You have the full text below, so do NOT call get_design_technique or get_font_pairing for any of them.",
    // Each recipe carries its own "WHEN TO USE / DO NOT use it when…" gate,
    // written for the case where the MODEL is choosing. Here the user already
    // chose, so those gates must not be re-applied — without this the model
    // reads "do not use on transactional emails", agrees, and silently drops
    // the skill the user explicitly asked for.
    "IMPORTANT — the selection overrides each recipe's own suitability gate: every recipe below contains 'WHEN TO USE' and 'DO NOT use it when…' guidance written for deciding whether to reach for it unprompted. That decision has already been made by the user. Ignore those gates entirely for the skills listed here and apply the recipe even if the brief looks like a case the recipe would normally exclude (transactional, minimal, B2B, developer, luxury). Everything else in each recipe — the code pattern, the numbered rules, the colors, the Outlook fallback — still applies exactly as written.",
    "The same override holds for the base instructions: a selected font pairing must be implemented with its <Font> tags even for a transactional or developer email that would otherwise use a system font stack.",
    // Structural techniques attach to a layout feature (a full-bleed image
    // band, a footer offer block). Without this the model keeps its own layout,
    // finds nowhere to put the technique, and quietly omits it.
    "BUILD THE STRUCTURE THE SKILL NEEDS: some recipes attach to a layout feature — an arc needs a full-bleed image band above it, a footer panel needs a block between the content and the footer. If the email you would otherwise write has no such feature, add it so the skill has somewhere to live: choose the layout archetype that accommodates every selected skill rather than fitting the skills into a layout that has no room for them.",
    "If two selected skills genuinely conflict, implement each the way its own rules prescribe (a panel technique that requires an inverted background dictates the surrounding palette) and note the tension in one short line of your chat reply.",
    ...sections,
  ].join("\n\n");
}
