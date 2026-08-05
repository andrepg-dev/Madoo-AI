/**
 * Curated font pairings with VERIFIED Google Fonts woff2 URLs.
 *
 * <Font> from react-email emits `src: url(<webFont.url>) format('woff2')`, so
 * the URL must point at an actual font file. A Google Fonts CSS API URL
 * (fonts.googleapis.com/css2?...) is a stylesheet, not a font, and fails
 * silently — the email just falls back and nobody notices. The model cannot
 * know real gstatic hashes, so it must never invent them: it calls the
 * get_font_pairing tool and copies the URLs from here.
 *
 * Every url below was resolved from the Google Fonts CSS2 API latin subset and
 * checked for a 200 font/woff2 response. Re-run that check if a pairing ever
 * renders as the fallback.
 */

export type FontFace = {
  family: string;
  weight: number;
  url: string;
};

export type FontPairing = {
  /** Stable tool-facing id. */
  name: string;
  /** One line shown in the system-prompt index. */
  teaser: string;
  /** Brand personalities this pairing serves. */
  fits: string;
  /** Display/headline face. */
  display: FontFace;
  /** Body face(s). The LAST <Font> tag wins the global `*` rule, so body goes last. */
  body: FontFace[];
  /** Fallback stack for the display face — what Gmail shows for headlines. */
  displayFallback: string;
  /** Fallback stack for the body face — what Gmail shows for body copy. */
  bodyFallback: string;
  /** Typographic guidance specific to this pairing. */
  notes: string;
};

export const FONT_PAIRINGS: FontPairing[] = [
  {
    name: "bold_retail",
    teaser:
      "bold_retail — Anton display + Inter body. Loud DTC promo, supplements, streetwear, flash sales.",
    fits: "High-energy retail promos, discount and drop announcements, fitness/supplement brands.",
    display: {
      family: "Anton",
      weight: 400,
      url: "https://fonts.gstatic.com/s/anton/v27/1Ptgg87LROyAm3Kz-C8CSKlv.woff2",
    },
    body: [
      {
        family: "Inter",
        weight: 400,
        url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
      },
      {
        family: "Inter",
        weight: 700,
        url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2",
      },
    ],
    displayFallback: "'Arial Black', Impact, Helvetica, Arial, sans-serif",
    bodyFallback: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    notes:
      "Anton is a single-weight condensed display face — never ask it for bold, and never use it below 24px or for body copy. It runs tight: set letterSpacing around -0.5px and a lineHeight near 1.0-1.1 on large headlines. Body copy is Inter 400 with Inter 700 for emphasis only.",
  },
  {
    name: "editorial_serif",
    teaser:
      "editorial_serif — Playfair Display headings + Lora body. Editorial letters, publishers, considered newsletters.",
    fits: "Editorial newsletters, founder letters, magazines, interiors, hospitality.",
    display: {
      family: "Playfair Display",
      weight: 700,
      url: "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKeiunDXbtPK-F2qC0s.woff2",
    },
    body: [
      {
        family: "Lora",
        weight: 400,
        url: "https://fonts.gstatic.com/s/lora/v37/0QI6MX1D_JOuGQbT0gvTJPa787weuxJBkq18ndeYxZ0.woff2",
      },
    ],
    displayFallback: "Georgia, 'Times New Roman', Times, serif",
    bodyFallback: "Georgia, 'Times New Roman', Times, serif",
    notes:
      "Serif-on-serif: keep the size contrast wide (headline 32-40px vs body 16-17px) or the two faces blur together. Lora needs a roomy 1.65-1.75 lineHeight. Pairs best with sharp 0px corners and minimal chrome.",
  },
  {
    name: "modern_tech",
    teaser:
      "modern_tech — Space Grotesk headings + Inter body. SaaS, developer tools, product updates.",
    fits: "SaaS product launches, changelogs, developer tools, fintech, B2B.",
    display: {
      family: "Space Grotesk",
      weight: 700,
      url: "https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVnskPMBBSSJLm2E.woff2",
    },
    body: [
      {
        family: "Inter",
        weight: 400,
        url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
      },
      {
        family: "Inter",
        weight: 700,
        url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2",
      },
    ],
    displayFallback: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    bodyFallback: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    notes:
      "Space Grotesk's quirky letterforms carry the personality, so keep the layout restrained. Headlines 28-36px with letterSpacing -0.6px; body Inter 16px at 1.6. Suits 8-10px corners.",
  },
  {
    name: "luxury_minimal",
    teaser:
      "luxury_minimal — Cormorant Garamond headings + Jost body. Luxury, beauty, jewellery, fine dining.",
    fits: "Luxury retail, beauty, jewellery, fragrance, fine dining, high-end travel.",
    display: {
      family: "Cormorant Garamond",
      weight: 600,
      url: "https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_iE9KnTOitk9IfqxUQ.woff2",
    },
    body: [
      {
        family: "Jost",
        weight: 400,
        url: "https://fonts.gstatic.com/s/jost/v20/92zPtBhPNqw79Ij1E865zBUv7myjJTVBNIgun_HKOEo.woff2",
      },
    ],
    displayFallback: "Garamond, Georgia, 'Times New Roman', serif",
    bodyFallback: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    notes:
      "Cormorant is delicate and reads small — run headlines large (36-48px) with a light 1.15 lineHeight, never under 24px. Demands whitespace: generous 44px section padding, sparse copy, 0px corners. Jost body at 15-16px with slight positive letterSpacing (0.2px).",
  },
  {
    name: "friendly_consumer",
    teaser:
      "friendly_consumer — DM Serif Display headings + DM Sans body. Consumer apps, food, subscriptions, DTC.",
    fits: "Consumer apps, food and beverage, subscription boxes, approachable DTC brands.",
    display: {
      family: "DM Serif Display",
      weight: 400,
      url: "https://fonts.gstatic.com/s/dmserifdisplay/v17/-nFnOHM81r4j6k0gjAW3mujVU2B2G_Bx0vrx52g.woff2",
    },
    body: [
      {
        family: "DM Sans",
        weight: 400,
        url: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxRSW32RmYJp8I5.woff2",
      },
      {
        family: "DM Sans",
        weight: 700,
        url: "https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwARZtRSW32RmYJp8I5.woff2",
      },
    ],
    displayFallback: "Georgia, 'Times New Roman', Times, serif",
    bodyFallback: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    notes:
      "Designed as a family pair, so it stays coherent with little effort. DM Serif Display has one weight (400) — do not request bold. Headlines 30-38px, body 16px at 1.6, soft 10-14px corners.",
  },
  {
    name: "organic_wellness",
    teaser:
      "organic_wellness — Fraunces headings + Karla body. Wellness, skincare, food, sustainable and craft brands.",
    fits: "Wellness, skincare, organic food, coffee, sustainable and craft brands.",
    display: {
      family: "Fraunces",
      weight: 700,
      url: "https://fonts.gstatic.com/s/fraunces/v38/6NUh8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0K7iN7hzFUPJH58nib1603gg7S2nfgRYIcUByTCf7Tp05GNyXk.woff2",
    },
    body: [
      {
        family: "Karla",
        weight: 400,
        url: "https://fonts.gstatic.com/s/karla/v33/qkBIXvYC6trAT55ZBi1ueQVIjQTD-JqaE0lKZbLXGhmR.woff2",
      },
    ],
    displayFallback: "Georgia, 'Times New Roman', Times, serif",
    bodyFallback: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    notes:
      "Fraunces is warm and soft-edged — the natural partner for the arc_section_edge technique and rounded corners (12-16px). Headlines 30-40px at 1.15. Karla body 16px at 1.65.",
  },
  {
    name: "neo_grotesque",
    teaser:
      "neo_grotesque — Archivo Black headings + Archivo body. Bold minimal, sports, agencies, brutalist.",
    fits: "Bold minimal brands, sports, streetwear, agencies, event announcements.",
    display: {
      family: "Archivo Black",
      weight: 400,
      url: "https://fonts.gstatic.com/s/archivoblack/v23/HTxqL289NzCGg4MzN6KJ7eW6CYyF_jzx13E.woff2",
    },
    body: [
      {
        family: "Archivo",
        weight: 400,
        url: "https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTTNDNZ9xdpBU7iVNRQ.woff2",
      },
      {
        family: "Archivo",
        weight: 700,
        url: "https://fonts.gstatic.com/s/archivo/v25/k3k6o8UDI-1M0wlSV9XAw6lQkqWY8Q82sJaRE-NWIDdgffTT0zRZ9xdpBU7iVNRQ.woff2",
      },
    ],
    displayFallback: "'Arial Black', Helvetica, Arial, sans-serif",
    bodyFallback: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    notes:
      "Same family at two extremes — very cohesive, very loud. Archivo Black is 400-only; do not request bold. Headlines 30-44px with letterSpacing -1px. Works with sharp 0px corners and flat color blocks.",
  },
  {
    name: "playful",
    teaser:
      "playful — Baloo 2 headings + Nunito body. Kids, pets, games, casual apps, celebratory emails.",
    fits: "Kids and family, pets, games, casual consumer apps, birthday and celebration emails.",
    display: {
      family: "Baloo 2",
      weight: 700,
      url: "https://fonts.gstatic.com/s/baloo2/v23/wXK0E3kTposypRydzVT08TS3JnAmtdj9yppo_leP6HcMqzQ.woff2",
    },
    body: [
      {
        family: "Nunito",
        weight: 400,
        url: "https://fonts.gstatic.com/s/nunito/v32/XRXI3I6Li01BKofiOc5wtlZ2di8HDLshdTQ3j6zbXWjgeg.woff2",
      },
    ],
    displayFallback: "'Trebuchet MS', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    bodyFallback: "'Trebuchet MS', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    notes:
      "Both faces are rounded, so the corner treatment must follow: 14px+ radii and pill buttons. Headlines 28-36px at 1.2. Keep the palette bright or the type reads childish rather than playful.",
  },
];

export const FONT_PAIRING_NAMES = FONT_PAIRINGS.map((p) => p.name);

/** One-line-per-pairing index embedded in the system prompt. */
export const FONT_PAIRING_INDEX = FONT_PAIRINGS.map(
  (p) => `- ${p.teaser}`,
).join("\n");

function renderFontTag(face: FontFace, fallback: string): string {
  return `<Font fontFamily="${face.family}" fallbackFontFamily={[${fallback
    .split(",")
    .map((f) => `'${f.trim().replace(/^'|'$/g, "")}'`)
    .join(", ")}]} webFont={{ url: '${face.url}', format: 'woff2' }} fontWeight={${face.weight}} fontStyle="normal" />`;
}

/**
 * Render a pairing as the exact <Head> block to paste, plus the rules that
 * make web fonts behave in email. Built here rather than stored as prose so
 * the snippet can never drift from the verified URLs above.
 */
export function renderFontPairing(pairing: FontPairing): string {
  const displayTag = renderFontTag(pairing.display, pairing.displayFallback);
  const bodyTags = pairing.body.map((f) =>
    renderFontTag(f, pairing.bodyFallback),
  );
  const bodyFamily = pairing.body[0]?.family ?? pairing.display.family;

  return `FONT PAIRING: ${pairing.name}
Fits: ${pairing.fits}
Display: ${pairing.display.family} ${pairing.display.weight} — headlines only.
Body: ${pairing.body.map((f) => `${f.family} ${f.weight}`).join(", ")}
Fallbacks (what Gmail actually shows) — headlines: ${pairing.displayFallback} | body: ${pairing.bodyFallback}

PASTE INSIDE <Head>, IN THIS ORDER:
${[displayTag, ...bodyTags].join("\n")}

THEN, IN THE COMPONENT:
- Headings: fontFamily: "'${pairing.display.family}', ${pairing.displayFallback}"
- Body/buttons/footer: fontFamily: "'${bodyFamily}', ${pairing.bodyFallback}"

TYPOGRAPHY NOTES
${pairing.notes}

HARD RULES FOR WEB FONTS IN EMAIL
1. Copy the URLs above EXACTLY. Never invent, shorten, or "update" a gstatic URL, and never put a fonts.googleapis.com/css2 stylesheet URL in webFont — <Font> writes it into \`src: url(...)\` and a stylesheet there fails silently.
2. <Font> also emits a global \`* { font-family: ... }\` rule, so the LAST <Font> tag wins for everything. Order matters: display first, body last. Then set the display family explicitly inline on every <Heading>.
3. Always carry the fallback stack inline on every element too — Gmail (web, iOS, Android), Outlook Windows, and Yahoo ignore web fonts entirely, so the fallback is what most recipients see. Pick sizes and line-heights that still look right in the fallback; never rely on the web font for the layout to hold.
3b. The headline and body fallbacks are DIFFERENT on purpose. Never give body copy the display fallback — a heavy display fallback like Arial Black is unreadable at 16px, and that is exactly what most of your recipients would get.
4. Do not load more than three <Font> tags — each one is a real download.
5. Keep \`mso-font-alt\` working by passing fallbackFontFamily; <Font> writes it for Outlook.`;
}

export function getFontPairing(name: string): FontPairing | undefined {
  return FONT_PAIRINGS.find((p) => p.name === name);
}
