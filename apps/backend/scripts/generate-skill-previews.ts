/**
 * Regenerates the skill-picker preview thumbnails.
 *
 * Run: npx ts-node --transpile-only scripts/generate-skill-previews.ts
 * Output: apps/client/public/skill-previews/<skill>.png
 *
 * Each demo is a miniature email built with the same components the generator
 * emits, compiled through the real ReactToHtmlService and screenshotted — so a
 * thumbnail shows what the skill actually produces, including the real webfont
 * for font pairings. They are static assets committed with the code: no S3, no
 * runtime cost, and no network call when the picker opens.
 *
 * These do NOT auto-update. Change a recipe's look and you must re-run this.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import puppeteer from "puppeteer";
import { ReactToHtmlService } from "../src/generation/react-to-html.service";
import { FONT_PAIRINGS } from "../src/generation/font-pairings";
import { renderDividerPng } from "../src/generation/section-divider";

const OUT_DIR = path.resolve(
  __dirname,
  "../../client/public/skill-previews",
);
const WIDTH = 260;
const HEIGHT = 170;

const PHOTO =
  "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=600";

/** Wraps demo body markup in the minimal shell the compiler expects. */
function demo(body: string, head = ""): string {
  return `const Email = () => (
  <Html lang="en"><Head>${head}</Head>
    <Body style={{ margin: 0, backgroundColor: '#F2F0EC' }}>
      <Container style={{ maxWidth: 260 }}>
        ${body}
      </Container>
    </Body>
  </Html>
);
export default Email;`;
}

const TECHNIQUE_DEMOS: Record<string, string> = {
  arc_section_edge: demo(`
    <Section style={{ backgroundColor: '#FFFFFF', padding: '18px 18px 14px', textAlign: 'center' }}>
      <Text style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#1B1B1B', fontFamily: 'Helvetica, Arial, sans-serif' }}>Spring drop is live</Text>
    </Section>
    <Section style={{ padding: 0, fontSize: 0, lineHeight: 0 }}>
      <Img src="__DIVIDER__" alt="" width={260} style={{ display: 'block', width: '100%' }} />
    </Section>
    <Section style={{ backgroundColor: '#8B85D9', padding: '14px 18px 26px', textAlign: 'center' }}>
      <Heading as="h2" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#FFFFFF', fontFamily: 'Helvetica, Arial, sans-serif' }}>Loved by families</Heading>
      <Text style={{ margin: '6px 0 0', fontSize: 11, color: '#EFEDFA', fontFamily: 'Helvetica, Arial, sans-serif' }}>Over 12,000 five-star reviews</Text>
    </Section>`),

  promo_code_pill: demo(`
    <Section style={{ backgroundColor: '#FFFFFF', padding: '34px 18px', textAlign: 'center' }}>
      <Text style={{ margin: 0, fontSize: 14, lineHeight: '30px', color: '#1B1B1B', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        Use code{' '}
        <span style={{ display: 'inline-block', padding: '5px 13px', borderRadius: 999, backgroundColor: '#E8873A', color: '#FFFFFF', fontSize: 14, fontWeight: 700, lineHeight: '18px', verticalAlign: 'middle' }}>SAVE10</span>{' '}
        at checkout
      </Text>
    </Section>`),

  top_announcement_bar: demo(`
    <Section style={{ backgroundColor: '#1F4436', padding: '9px 14px', textAlign: 'center' }}>
      <Text style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#FFFFFF', lineHeight: '14px', fontFamily: 'Helvetica, Arial, sans-serif' }}>Free shipping on all US orders</Text>
    </Section>
    <Section style={{ backgroundColor: '#FFFFFF', padding: '20px 18px', textAlign: 'center' }}>
      <Text style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: '#1B1B1B', fontFamily: 'Helvetica, Arial, sans-serif' }}>Northwind</Text>
      <Text style={{ margin: 0, fontSize: 11, color: '#6B6B6B', lineHeight: '16px', fontFamily: 'Helvetica, Arial, sans-serif' }}>Your spring picks are here.</Text>
    </Section>`),

  footer_offer_panel: demo(`
    <Section style={{ backgroundColor: '#FFFFFF', padding: '16px 18px', textAlign: 'center' }}>
      <Text style={{ margin: 0, fontSize: 11, color: '#6B6B6B', fontFamily: 'Helvetica, Arial, sans-serif' }}>Order #4821 is on its way.</Text>
    </Section>
    <Section style={{ padding: 0, fontSize: 0, lineHeight: 0 }}>
      <div style={{ height: 20, backgroundColor: '#141414', borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
    </Section>
    <Section style={{ backgroundColor: '#141414', padding: '2px 16px 20px', textAlign: 'center' }}>
      <Heading as="h2" style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#FFFFFF', fontFamily: 'Helvetica, Arial, sans-serif' }}>Save this for next time</Heading>
      <Text style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800, fontStyle: 'italic', color: '#E4D65B', fontFamily: 'Helvetica, Arial, sans-serif' }}>10% off</Text>
      <div style={{ border: '1px dashed #E4D65B', borderRadius: 5, padding: '5px 12px', display: 'inline-block' }}>
        <Text style={{ margin: 0, fontSize: 11, color: '#E4D65B', fontFamily: 'Helvetica, Arial, sans-serif' }}>code — NEXT10</Text>
      </div>
    </Section>`),
};

/** Type specimen: the pairing's own display + body faces, loaded for real. */
function fontDemo(name: string): string {
  const pairing = FONT_PAIRINGS.find((p) => p.name === name)!;
  const tags = [
    `<Font fontFamily="${pairing.display.family}" fallbackFontFamily="Helvetica" webFont={{ url: '${pairing.display.url}', format: 'woff2' }} fontWeight={${pairing.display.weight}} />`,
    ...pairing.body.map(
      (f) =>
        `<Font fontFamily="${f.family}" fallbackFontFamily="Helvetica" webFont={{ url: '${f.url}', format: 'woff2' }} fontWeight={${f.weight}} />`,
    ),
  ].join("");
  const bodyFamily = pairing.body[0]?.family ?? pairing.display.family;
  return demo(
    `
    <Section style={{ backgroundColor: '#FFFFFF', padding: '26px 20px' }}>
      <Heading as="h1" style={{ margin: '0 0 10px', fontSize: 26, lineHeight: '28px', fontWeight: ${pairing.display.weight}, color: '#141414', fontFamily: "'${pairing.display.family}', ${pairing.displayFallback}" }}>Aa</Heading>
      <Text style={{ margin: '0 0 6px', fontSize: 15, lineHeight: '19px', fontWeight: ${pairing.display.weight}, color: '#141414', fontFamily: "'${pairing.display.family}', ${pairing.displayFallback}" }}>${pairing.display.family}</Text>
      <Text style={{ margin: 0, fontSize: 12, lineHeight: '17px', color: '#5C5C5C', fontFamily: "'${bodyFamily}', ${pairing.bodyFallback}" }}>${bodyFamily} carries the body copy at a comfortable reading size.</Text>
    </Section>`,
    tags,
  );
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  // The arc demo needs a real divider; inline it as a data URI so generating
  // previews never depends on S3. Emails use a hosted URL instead.
  const dividerDataUri = `data:image/png;base64,${renderDividerPng({
    shape: "wave",
    topColor: "#FFFFFF",
    bottomColor: "#8B85D9",
    width: 520,
    height: 90,
  }).toString("base64")}`;
  TECHNIQUE_DEMOS.arc_section_edge = TECHNIQUE_DEMOS.arc_section_edge.replace(
    "__DIVIDER__",
    dividerDataUri,
  );
  const service = new ReactToHtmlService();
  const browser = await puppeteer.launch();

  const jobs: [string, string][] = [
    ...Object.entries(TECHNIQUE_DEMOS),
    ...FONT_PAIRINGS.map(
      (p) => [p.name, fontDemo(p.name)] as [string, string],
    ),
  ];

  for (const [name, code] of jobs) {
    const html = service.compile(code, {});
    const page = await browser.newPage();
    await page.setViewport({
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 2,
    });
    await page.setContent(html, { waitUntil: "networkidle0" });
    // Webfonts must be fully loaded or the specimen screenshots its fallback.
    await page.evaluate(() => (document as never as Document).fonts.ready);
    await page.screenshot({
      path: path.join(OUT_DIR, `${name}.png`) as `${string}.png`,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
    await page.close();
    console.log(`  ${name}.png`);
  }

  await browser.close();
  console.log(`\nwrote ${jobs.length} previews to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
