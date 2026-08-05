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
 * system-prompt index. Those read as instructions to a model, not as picker
 * copy, so the picker carries its own: a short scannable summary plus a
 * concrete example of the result, shown on hover.
 */
type PickerCopy = { summary: string; example: string };

const PICKER_COPY: Record<string, PickerCopy> = {
  // Techniques — describe what the reader sees, not how it is built.
  arc_section_edge: {
    summary: "Curved edge under a photo band",
    example:
      "The hero photo ends in a soft dome instead of a straight line, like a food or skincare promo.",
  },
  promo_code_pill: {
    summary: "Discount code as an inline chip",
    example:
      "\u201cUse code SAVE10 at checkout\u201d \u2014 the code sits in a colored pill inside the sentence.",
  },
  top_announcement_bar: {
    summary: "Thin strip above the header",
    example:
      "A dark band reading \u201cFree shipping on all US orders\u201d sitting above your logo.",
  },
  footer_offer_panel: {
    summary: "Dark offer card above the footer",
    example:
      "\u201cSave this for your next order \u2014 10% off\u201d as an inverted card just before the footer.",
  },
  // Font pairings — the summary is the pairing, the example is where it fits.
  bold_retail: {
    summary: "Anton + Inter",
    example: "Loud DTC promos: supplements, streetwear, flash sales.",
  },
  editorial_serif: {
    summary: "Playfair Display + Lora",
    example: "Founder letters, magazines, considered newsletters.",
  },
  modern_tech: {
    summary: "Space Grotesk + Inter",
    example: "SaaS launches, changelogs, developer tools, fintech.",
  },
  luxury_minimal: {
    summary: "Cormorant Garamond + Jost",
    example: "Jewellery, fragrance, fine dining, high-end travel.",
  },
  friendly_consumer: {
    summary: "DM Serif Display + DM Sans",
    example: "Consumer apps, food and drink, subscription boxes.",
  },
  organic_wellness: {
    summary: "Fraunces + Karla",
    example: "Skincare, organic food, coffee, sustainable brands.",
  },
  neo_grotesque: {
    summary: "Archivo Black + Archivo",
    example: "Sports, streetwear, agencies, bold event announcements.",
  },
  playful: {
    summary: "Baloo 2 + Nunito",
    example: "Kids and pets, games, casual apps, celebrations.",
  },
};

function humanizeId(name: string): string {
  const spaced = name.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Picker row copy. Falls back to the model-facing teaser when a catalog entry
 * has no hand-written copy yet, so adding a skill never breaks the picker.
 */
function pickerRow(name: string, teaser: string) {
  const copy = PICKER_COPY[name];
  const fallback = teaser.split(" — ").slice(1).join(" — ").trim() || teaser;
  return {
    label: humanizeId(name),
    summary: copy?.summary ?? fallback,
    example: copy?.example ?? fallback,
  };
}

export function listSkills(): SkillDto[] {
  return [
    ...DESIGN_TECHNIQUES.map((technique) => {
      const { label, summary, example } = pickerRow(
        technique.name,
        technique.teaser,
      );
      return {
        name: technique.name,
        kind: "technique" as const,
        label,
        summary,
        example,
      };
    }),
    ...FONT_PAIRINGS.map((pairing) => {
      const { label, summary, example } = pickerRow(
        pairing.name,
        pairing.teaser,
      );
      return {
        name: pairing.name,
        kind: "font" as const,
        label,
        summary,
        example,
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
