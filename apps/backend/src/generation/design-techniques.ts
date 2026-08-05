/**
 * Curated catalog of advanced email design techniques.
 *
 * These are deliberately NOT in the base system prompt: they are opt-in moves
 * that only fit a minority of briefs, and putting them inline would push the
 * model to use them everywhere. Instead the prompt carries a one-line index
 * (see DESIGN_TECHNIQUE_INDEX) and the model calls the get_design_technique
 * tool to pull the full recipe when a brief actually calls for it.
 *
 * Each entry must stay self-contained: when to use it, when NOT to, a
 * copy-pasteable pattern, and how it degrades in Outlook Windows (the Word
 * rendering engine ignores border-radius, negative margins, and CSS
 * backgrounds — every technique here must fall back to something plain, never
 * to something broken).
 */

export type DesignTechnique = {
  /** Stable tool-facing id. */
  name: string;
  /** One line shown in the system-prompt index so the model knows it exists. */
  teaser: string;
  /** Full recipe returned by the tool. */
  doc: string;
};

const ARC_SECTION_EDGE: DesignTechnique = {
  name: "arc_section_edge",
  teaser:
    "arc_section_edge — wave/curve boundary between two sections or under a photo band (modern DTC look).",
  doc: `SHAPED SECTION EDGE — a curved or angled boundary between two sections, or under a full-bleed hero band.

METHOD 1 — GENERATED DIVIDER IMAGE (use this by default)
Call generate_section_divider with the shape and the two section colors, then drop the returned PNG in full-bleed between the sections. This is the only way to get a real editorial wave: an asymmetric S-curve, a shallow swell, or a diagonal. CSS cannot draw those in email — SVG is stripped by Gmail, clip-path is unsupported, and border-radius can ONLY make a symmetric dome, which reads as a plain rounded corner rather than a designed transition.

<Section style={{ backgroundColor: '#FFFFFF', padding: '32px' }}>
  {/* content of the upper section */}
</Section>
{/* divider: no padding, no background — the PNG carries both colors */}
<Section style={{ padding: 0, fontSize: 0, lineHeight: 0 }}>
  <Img src={dividerImage} alt="" width={600} style={{ display: 'block', width: '100%', maxWidth: '100%' }} />
</Section>
<Section style={{ backgroundColor: '#8B85D9', padding: '32px' }}>
  {/* content of the lower section */}
</Section>

Rules for the divider image:
1. topColor and bottomColor passed to the tool MUST equal the two adjacent section backgrounds exactly, or a seam appears.
2. The divider <Section> takes no padding and no backgroundColor of its own; fontSize/lineHeight 0 kills the text-node gap Gmail adds under an image.
3. Height 90-160px reads as a transition; taller becomes a design element competing with the content.
4. Prefer shape 'wave' — the asymmetric curve is what makes it look designed. Use 'wave-soft' under dense content, 'slant' for a sharper brand, 'arc' only when a symmetric dome is genuinely wanted.
5. When a section has a divider both above and below, pass flip:true to one of them so they are not identical.
6. alt="" — it is decorative, and a screen reader announcing it adds nothing.
7. Do NOT add the divider URL to variableSchema; it is a fixed design asset, not user content.
8. Works everywhere including Outlook, because it is just an image. No fallback needed.
9. TRANSPARENCY: pass 'transparent' for a band whose background you cannot name — a photo, a gradient, or a hero whose colors come from the image. The PNG then carries an alpha channel and only the shaped band is painted. Use it only when you must: a solid two-color divider is safer, because a transparent PNG shows whatever is behind it, and Outlook Windows renders the containing table's background rather than a CSS background-image. When you do go transparent, set a real backgroundColor on the section behind the divider so there is always something sane underneath, and never make both bands transparent — that is a blank image.

METHOD 2 — CSS RADIUS (fallback only)
Use this only for a plain symmetric dome when an extra hosted image is genuinely unwanted. It is the basic look; it is not the professional one.

WHEN TO USE
- Lifestyle, food, beauty, wellness, travel, or seasonal promos where the hero is a photo band and the brand feels soft/organic.
- The user asked for a curved, rounded, wave, or "swoosh" edge, or attached a reference image that has one.
USE AT MOST ONE ARC PER EMAIL. Never arc a logo bar, a footer, a text-only section, or a transactional/developer/luxury-editorial email — a curve reads as consumer-friendly and fights those brands.

HOW IT WORKS
An arc is an elliptical border-radius on a solid block painted in the color of the section that follows the hero. Never use SVG (Gmail strips it) and never bake the curve into the photo (the color must follow the brand).

RADIUS PATTERN A — background-image hero (no negative margins, Outlook-safe)
Note the scrim in backgroundImage: text over a photo is unreadable without one, and you cannot see the photo you were given. It is not optional.
<Section style={{ padding: 0, backgroundImage: \`linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(\${heroImage})\`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#3A403C' }}>
  <Section className="section-pad" style={{ padding: '64px 32px 88px', textAlign: 'center' }}>
    {/* headline, code pill, CTA — all overlaid on the photo */}
  </Section>
  {/* arc: backgroundColor MUST equal the background of the section BELOW this one */}
  <Section style={{ padding: 0, fontSize: 0, lineHeight: 0 }}>
    <div className="arc" style={{ height: 40, backgroundColor: '#EAF4EE', borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
  </Section>
</Section>

RADIUS PATTERN B — plain <Img> hero (clip the image itself)
<Img src={heroImage} width={600} alt="…" style={{ width: '100%', display: 'block', borderRadius: '0 0 50% 50% / 0 0 10% 10%' }} />

CHOOSING THE RADIUS
- Arc block sitting BELOW the photo (pattern A), doming upward into it: '50% 50% 0 0 / 100% 100% 0 0'.
- Element clipping ITSELF at the bottom (pattern B): '0 0 50% 50% / 0 0 10% 10%'.
- The first pair is the horizontal radius (keep 50%), the pair after the slash is the vertical radius — that is what controls how deep the curve bites.

RULES
1. The arc color must be the EXACT hex of the adjacent section background. A near-miss reads as a visible seam.
2. Arc height 24-56px on desktop; add \`.arc { height: 24px !important; }\` to the mobile media query.
3. Put \`fontSize: 0, lineHeight: 0\` on the wrapper — otherwise Gmail injects a text-node gap under the arc.
4. The hero Section that holds the arc must have \`padding: 0\`; put the real padding on an inner <Section> so the arc can run full-bleed.
5. Keep the backgroundColor fallback on a background-image hero (see the HERO IMAGE LAYOUT rule) — the arc does not remove that requirement.
6. Do not combine an arc with heavy corner rounding elsewhere; pick one corner language for the email.

FALLBACK (Outlook Windows / Word engine)
border-radius is ignored, so the arc div renders as a flat 40px band in the next section's color — it reads as ordinary spacing, not as a defect. Pattern B degrades to a square image. Both are acceptable; never rely on the curve to carry meaning.`,
};

const PROMO_CODE_PILL: DesignTechnique = {
  name: "promo_code_pill",
  teaser:
    "promo_code_pill — inline highlighted discount-code chip sitting inside a sentence (\"use code [SAVE10] at checkout\").",
  doc: `PROMO CODE PILL — a discount code rendered as a colored chip inline with the sentence around it.

WHEN TO USE
Discount / coupon / referral emails where the code is the hero action. Preferred over a bordered "coupon box" when the design already has a strong hero, because it keeps one focal point instead of two.

PATTERN
<Text style={{ margin: 0, fontSize: 20, lineHeight: '40px', color: '#1B1B1B', textAlign: 'center' }}>
  Use code{' '}
  <span style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 999, backgroundColor: '#E8873A', color: '#FFFFFF', fontSize: 20, fontWeight: 700, letterSpacing: '0.5px', lineHeight: '24px', verticalAlign: 'middle' }}>{discountCode}</span>{' '}
  at checkout
</Text>

RULES
1. The pill is a <span> inside a <Text> — never a <Button> (it is not a link) and never a nested table (it must stay inline with the words).
2. Set \`verticalAlign: 'middle'\` and give the parent <Text> a lineHeight at least pill height + 8px, or Outlook clips the chip.
3. Keep the code as its own merge variable (discountCode, scope=static) so users can swap it.
4. Contrast: chip background vs chip text must stay legible; the chip color should be the brand accent, not a new color.
5. Do not letter-space the code beyond ~1px — codes get read character by character and wide tracking hurts copying.
6. Outlook Windows ignores borderRadius 999 → renders a rectangle chip. Acceptable; do not add a border to compensate.`,
};

const TOP_ANNOUNCEMENT_BAR: DesignTechnique = {
  name: "top_announcement_bar",
  teaser:
    "top_announcement_bar — thin full-width strip above the header for a secondary message (free shipping, ends Sunday).",
  doc: `TOP ANNOUNCEMENT BAR — a thin, full-width, high-contrast strip above the email header carrying one secondary message.

WHEN TO USE
Retail/e-commerce promos with a real second message that must not steal the headline's job: shipping terms, offer deadline, membership perk. Skip it when there is no genuine second message — an empty bar is decoration and reads as template filler.

PATTERN
<Section className="section-pad" style={{ backgroundColor: '#1F4436', padding: '14px 24px', textAlign: 'center' }}>
  <Text style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#FFFFFF', lineHeight: '18px' }}>
    Free shipping on all US orders
  </Text>
</Section>

RULES
1. One line of copy, ~50 characters max — it must never wrap to three lines on mobile.
2. Bar background is a deep brand shade; text is the contrasting light tone. It should read as a band, not as a button.
3. Height stays thin: 12-16px vertical padding, 12-14px type. Growing it turns it into a second hero.
4. Placement is above the logo/header, or directly under it — never below the hero.
5. Keep the message non-clickable unless it has its own destination; if it links, the whole <Text> becomes a <Link> with the same color.
6. Never pair it with a second banner strip elsewhere in the email.`,
};

const FOOTER_OFFER_PANEL: DesignTechnique = {
  name: "footer_offer_panel",
  teaser:
    "footer_offer_panel — dark high-contrast offer card above the footer (next-order discount, referral, upsell) with an arched top edge.",
  doc: `FOOTER OFFER PANEL — an inverted, high-contrast card sitting between the main content and the footer, carrying ONE secondary offer.

STEP 1 — PICK THE PANEL COLOR BEFORE YOU WRITE ANYTHING
Look at the background color of the content sections ABOVE the panel and answer one question: is that content light or dark?
- Content is LIGHT (white/cream/pale surface) -> use PATTERN A below (dark panel). This is the common case.
- Content is DARK (near-black, deep brand shade, dark luxury) -> use PATTERN B below (light/accent panel). A dark panel in a dark email is INVALID — it reads as one more band and the technique does nothing. Nudging the panel a few shades darker than the content does NOT count as inversion; the two backgrounds must sit on opposite ends of the luminance range, not adjacent to each other.
Never emit a panel whose background is within roughly 25% luminance of the content background above it. If you cannot achieve that inversion with the brand's palette, drop this technique entirely and use a plain bordered offer row instead.

WHEN TO USE
Post-purchase, order confirmation, shipping, and thank-you emails where a next-order incentive belongs after the primary message: "save this for your next order", a referral code, a restock reminder, a members' perk. Also works at the bottom of a promo when the second offer must clearly rank below the first.
DO NOT use it when the email's primary CTA IS the discount — you would then have two competing offers. Never put more than one of these in an email, and never place it above the main content.

WHY IT WORKS
Inverting the palette (dark panel inside a light email) separates the secondary offer from the primary message without shrinking it. The reader reads it as a distinct object — a card slipped into the box — rather than as more email.

CHECK THE EMAIL'S OWN PALETTE FIRST — the inversion is the entire technique. If the email above this panel is already dark, a dark panel is invisible: it reads as one more band and the effect is lost. In that case either invert the other way (panel in the brand's light or accent tone, dark text on it, dark button) or drop the technique and use a plain bordered offer row. Never place a dark panel in a dark email. If you flip the panel light, flip every color in the pattern below with it: the accent becomes a deep tone, the dashed border and emphasis use that deep tone, and the button becomes dark with light text.

PATTERN A — dark panel, for an email whose content is LIGHT
{/* arched top: same color as the panel, so the panel reads as domed. Omit for a flat-top card. */}
<Section style={{ padding: 0, fontSize: 0, lineHeight: 0 }}>
  <div className="arc" style={{ height: 34, backgroundColor: '#141414', borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
</Section>
<Section className="section-pad" style={{ backgroundColor: '#141414', padding: '8px 36px 40px', textAlign: 'center' }}>
  <Heading as="h2" style={{ margin: '0 0 14px', fontSize: 30, lineHeight: '34px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
    Save this for your next order
  </Heading>
  <Text style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, fontStyle: 'italic', color: '#E4D65B', lineHeight: '30px' }}>
    10% off
  </Text>
  <Text style={{ margin: '0 0 22px', fontSize: 16, lineHeight: '24px', color: '#E8E8E8' }}>
    Perfect for the next upgrade or restock.
  </Text>
  {/* code box: dashed border, accent text — reads as a voucher, not a button */}
  <Section style={{ padding: 0, margin: '0 0 20px' }}>
    <div style={{ border: '1px dashed #E4D65B', borderRadius: 6, padding: '10px 18px', display: 'inline-block' }}>
      <Text style={{ margin: 0, fontSize: 16, color: '#E4D65B', lineHeight: '20px' }}>
        code — <span style={{ fontWeight: 800 }}>{nextOrderCode}</span>
      </Text>
    </div>
  </Section>
  <Button href={shopUrl} style={{ display: 'inline-block', backgroundColor: '#E4D65B', color: '#141414', fontSize: 15, fontWeight: 800, padding: '14px 30px', borderRadius: 999, textDecoration: 'none' }}>
    Shop best sellers
  </Button>
  <Text style={{ margin: '24px 0 0', fontSize: 16, lineHeight: '24px', color: '#FFFFFF' }}>
    Your box includes a leaflet with a{' '}
    <span style={{ color: '#E4D65B', fontWeight: 800 }}>free starter training program</span>.
  </Text>
</Section>

PATTERN B — light/accent panel, for an email whose content is DARK
Identical structure to PATTERN A with every color flipped. The panel becomes the brightest block in the email, which is what makes it separate from a dark body.
- Arc + panel background: the brand's light or accent tone (e.g. '#F2EDE4' cream, or a saturated brand accent). Not white if the email already uses white text areas.
- Headline and body text: the email's dark tone (e.g. '#141414'), never mid-gray.
- Offer figure, dashed code border, and closing emphasis: a deep saturated brand tone that stays legible on the light panel — never a pale accent, which vanishes here.
- Button: dark fill ('#141414') with light text — the inverse of PATTERN A.
Keep every structural rule below unchanged; only the colors move.

RULES
1. Exactly one accent color inside the panel, used for the offer figure, the code, the button, and the closing emphasis — nothing else. A second accent kills the effect.
2. In PATTERN A the panel background is near-black or a very deep brand shade (not pure #000, which bands in dark mode) with body copy at #E8E8E8-#FFFFFF. In PATTERN B it is the light/accent tone with body copy in the dark tone. Either way, never mid-gray text.
3. Code box uses a DASHED border and no fill so it reads as a voucher and is not mistaken for the button. The button is the only filled accent block.
4. One CTA only. The panel's job is a single secondary action.
5. Keep the panel narrower in feel than the content above it — generous 32-40px horizontal padding does that without changing width.
6. The regular footer (unsubscribe, address, legal) still goes BELOW this panel and keeps the light email background. This panel never replaces the footer.
7. Sentence case, per the NO ALL-CAPS rule — reference designs of this pattern usually shout in condensed caps; do not copy that unless the user asks or the inspected brand does it. Get the impact from size, weight, and the color inversion instead.
8. If the email carries dark-mode overrides, exclude a PATTERN A panel's classNames from them — it is already dark and must not be flipped to light.
9. The arched top reuses arc_section_edge (arc color = panel color, sitting above the panel). Skip the arc if the email's corner language is sharp.

FALLBACK (Outlook Windows)
The arc renders as a flat band in the panel color that merges into the panel — a plain rectangular card. borderRadius on the code box and pill button also flattens. All acceptable; the color inversion, which carries the technique, works everywhere.`,
};

export const DESIGN_TECHNIQUES: DesignTechnique[] = [
  ARC_SECTION_EDGE,
  PROMO_CODE_PILL,
  TOP_ANNOUNCEMENT_BAR,
  FOOTER_OFFER_PANEL,
];

export const DESIGN_TECHNIQUE_NAMES = DESIGN_TECHNIQUES.map((t) => t.name);

/** One-line-per-technique index embedded in the system prompt. */
export const DESIGN_TECHNIQUE_INDEX = DESIGN_TECHNIQUES.map(
  (t) => `- ${t.teaser}`,
).join("\n");

export function getDesignTechnique(name: string): DesignTechnique | undefined {
  return DESIGN_TECHNIQUES.find((t) => t.name === name);
}
