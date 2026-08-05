import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type * as React from "react";
import { ReactToHtmlService } from "./react-to-html.service";
import { auditContrast, contrastRatio, parseColor } from "./contrast-audit";

const reactToHtml = new ReactToHtmlService();
const audit = (code: string) =>
  auditContrast(reactToHtml.compileComponent(code), {});

describe("contrast-audit", () => {
  describe("color parsing", () => {
    it("parses hex, short hex, and rgba", () => {
      assert.deepEqual(parseColor("#141414"), { r: 20, g: 20, b: 20, a: 1 });
      assert.deepEqual(parseColor("#FFF"), { r: 255, g: 255, b: 255, a: 1 });
      assert.deepEqual(parseColor("rgba(0, 0, 0, 0.55)"), { r: 0, g: 0, b: 0, a: 0.55 });
    });

    it("returns null for values it cannot resolve", () => {
      assert.equal(parseColor("transparent"), null);
      assert.equal(parseColor("var(--brand)"), null);
      assert.equal(parseColor(undefined), null);
    });

    it("computes known WCAG ratios", () => {
      const white = parseColor("#FFFFFF")!;
      const black = parseColor("#000000")!;
      assert.ok(Math.abs(contrastRatio(white, black) - 21) < 0.01);
      assert.ok(Math.abs(contrastRatio(white, white) - 1) < 0.0001);
    });
  });

  describe("text findings", () => {
    // The exact failure the model shipped: a light card inside a dark email
    // that kept the outer light text color.
    it("flags light text left on a light card inside a dark email", () => {
      const findings = audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#141414', color: '#FFFFFF' }}>
            <Section style={{ backgroundColor: '#F2EDE4' }}>
              <Text style={{ color: '#FFFFFF' }}>Whey Protein — Chocolate</Text>
            </Section>
          </Body></Html>
        );
        export default Email;
      `);
      assert.equal(findings.length, 1);
      assert.equal(findings[0].kind, "text");
      assert.equal(findings[0].foreground, "#FFFFFF");
      assert.equal(findings[0].background, "#F2EDE4");
      assert.ok(findings[0].ratio < 1.2);
    });

    it("inherits text color from an ancestor when the element sets none", () => {
      const findings = audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#FFFFFF', color: '#FAFAFA' }}>
            <Section><Text>Inherited light text on white</Text></Section>
          </Body></Html>
        );
        export default Email;
      `);
      assert.equal(findings.length, 1);
      assert.equal(findings[0].background, "#FFFFFF");
    });

    it("passes a correctly inverted panel", () => {
      assert.deepEqual(audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#141414', color: '#FFFFFF' }}>
            <Section style={{ backgroundColor: '#F2EDE4' }}>
              <Text style={{ color: '#141414' }}>Save this for your next order</Text>
            </Section>
          </Body></Html>
        );
        export default Email;
      `), []);
    });

    it("leaves muted footer gray alone", () => {
      assert.deepEqual(audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#FFFFFF' }}>
            <Text style={{ color: '#999999' }}>You're receiving this because you placed an order.</Text>
          </Body></Html>
        );
        export default Email;
      `), []);
    });

    it("skips text over a background image or scrim gradient", () => {
      assert.deepEqual(audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#FFFFFF' }}>
            <Section style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(https://x/y.jpg)', backgroundColor: '#3A403C' }}>
              <Heading style={{ color: '#FFFFFF' }}>5% off your entire cart</Heading>
            </Section>
          </Body></Html>
        );
        export default Email;
      `), []);
    });

    it("skips the hidden preheader", () => {
      assert.deepEqual(audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#FFFFFF', color: '#FFFFFF' }}>
            <Preview>Your order ships in 2 days</Preview>
          </Body></Html>
        );
        export default Email;
      `), []);
    });

    it("reports one finding per distinct color pair", () => {
      const findings = audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#141414' }}>
            <Text style={{ color: '#1A1A1A' }}>One</Text>
            <Text style={{ color: '#1A1A1A' }}>Two</Text>
            <Text style={{ color: '#1A1A1A' }}>Three</Text>
          </Body></Html>
        );
        export default Email;
      `);
      assert.equal(findings.length, 1);
    });
  });

  describe("button findings", () => {
    // The other shipped failure: a near-black CTA on a near-black section.
    it("flags a dark button on a dark section", () => {
      const findings = audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#141414' }}>
            <Section style={{ backgroundColor: '#141414' }}>
              <Button href="https://example.com" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF' }}>Track your order</Button>
            </Section>
          </Body></Html>
        );
        export default Email;
      `);
      assert.equal(findings.length, 1);
      assert.equal(findings[0].kind, "button");
      assert.equal(findings[0].sample, "Track your order");
    });

    it("accepts a dark button carrying a visible border", () => {
      assert.deepEqual(audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#141414' }}>
            <Button href="https://example.com" style={{ backgroundColor: '#1A1A1A', color: '#FFFFFF', border: '1px solid #E4D65B' }}>Track your order</Button>
          </Body></Html>
        );
        export default Email;
      `), []);
    });

    it("accepts an accent button on a dark section", () => {
      assert.deepEqual(audit(`
        const Email = () => (
          <Html><Body style={{ backgroundColor: '#141414' }}>
            <Button href="https://example.com" style={{ backgroundColor: '#E4D65B', color: '#141414' }}>Shop best sellers</Button>
          </Body></Html>
        );
        export default Email;
      `), []);
    });
  });

  it("never throws on a component it cannot evaluate", () => {
    const broken = (() => {
      throw new Error("boom");
    }) as unknown as React.ComponentType<Record<string, unknown>>;
    assert.deepEqual(auditContrast(broken), []);
  });
});
