import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyVisualOps,
  extractElementSnippet,
  tagComponentSource,
} from "./tsx-visual-ops";
import { assertSafeComponentSource } from "../generation/react-code-guard";
import { ReactToHtmlService } from "../generation/react-to-html.service";

const SAMPLE = `import * as React from 'react';
import { Html, Head, Body, Container, Section, Row, Column, Text, Button, Preview } from '@react-email/components';

const Email = ({
  headline = 'Something new is shipping',
  ctaLabel = 'Explore',
  items = ['a', 'b'],
} = {}) => (
  <Html lang="en">
    <Head />
    <Preview>{headline}</Preview>
    <Body style={{ margin: 0 }}>
      <Container style={{ maxWidth: 580 }}>
        <Section style={{ padding: '20px' }}>
          <Text style={{ fontSize: 38 }}>{headline}</Text>
          <Text style={{ fontSize: 16 }}>A hard-coded paragraph.</Text>
          <Button href="#" style={{ padding: '14px' }}>{ctaLabel}</Button>
        </Section>
        <Section>
          <Row>
            {items.map((item) => (
              <Column key={item}><Text>{item}</Text></Column>
            ))}
          </Row>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default Email;
`;

function idOf(tagged: string, marker: string): string {
  // Finds the data-m-id of the first tagged element whose source line contains
  // `marker`. Falls back to a forward window search because recast reprints
  // modified opening tags across multiple lines.
  const line = tagged
    .split("\n")
    .find((l) => l.includes(marker) && l.includes("data-m-id"));
  const source = line ?? (() => {
    const at = tagged.indexOf(marker);
    assert.ok(at >= 0, `marker not found: ${marker}`);
    return tagged.slice(at, at + 400);
  })();
  const m = source.match(/data-m-id="(\d+:\d+)"/);
  assert.ok(m, `no data-m-id near marker: ${marker}`);
  return m[1];
}

describe("tagComponentSource", () => {
  const tagged = tagComponentSource(SAMPLE);

  it("tags visual elements with line:column ids", () => {
    assert.match(tagged, /<Section[^>]*data-m-id="\d+:\d+"/);
    assert.match(tagged, /<Button[^>]*data-m-id="\d+:\d+"/);
  });

  it("does not tag structural elements", () => {
    assert.doesNotMatch(tagged, /<Html[^>]*data-m-id/);
    assert.doesNotMatch(tagged, /<Head[^>]*data-m-id/);
    assert.doesNotMatch(tagged, /<Preview[^>]*data-m-id/);
  });

  it("flags var-bound and literal text", () => {
    assert.match(tagged, /data-m-text="var:headline"/);
    assert.match(tagged, /data-m-text="var:ctaLabel"/);
    assert.match(tagged, /data-m-text="literal"/);
  });

  it("flags elements inside .map as dynamic without text editing", () => {
    const columnLine = tagged
      .split("\n")
      .find((l) => l.includes("<Column") && l.includes("data-m-id"));
    assert.ok(columnLine);
    assert.match(columnLine, /data-m-dynamic="1"/);
    assert.doesNotMatch(columnLine, /data-m-text/);
  });

  it("keeps the tagged source inside the security allowlist", () => {
    assert.doesNotThrow(() => assertSafeComponentSource(tagged));
  });

  it("guard blocks dangerouslySetInnerHTML (preview iframe is same-origin)", () => {
    const evil = SAMPLE.replace(
      "<Text style={{ fontSize: 16 }}>A hard-coded paragraph.</Text>",
      `<Text dangerouslySetInnerHTML={{ __html: '<img onerror="x" src=x>' }} />`,
    );
    assert.throws(() => assertSafeComponentSource(evil), /dangerouslySetInnerHTML/);
  });

  it("compiles to HTML carrying the ids through react-email", () => {
    const service = new ReactToHtmlService();
    const html = service.compile(tagged, {});
    assert.match(html, /data-m-id="\d+:\d+"/);
    assert.match(html, /data-m-text="var:headline"/);
    assert.match(html, /data-m-dynamic="1"/);
  });
});

describe("applyVisualOps", () => {
  const tagged = tagComponentSource(SAMPLE);

  it("setText on a literal replaces the children", () => {
    const id = idOf(tagged, "A hard-coded paragraph.");
    const result = applyVisualOps(SAMPLE, [
      { op: "setText", nodeId: id, text: "New copy." },
    ]);
    assert.match(result.code, />New copy\.</);
    assert.doesNotMatch(result.code, /A hard-coded paragraph\./);
    assert.equal(result.variableUpdates.length, 0);
    assert.deepEqual(result.summaries, ["Edited text in <Text>"]);
  });

  it("setText with JSX-unsafe characters becomes a string expression", () => {
    const id = idOf(tagged, "A hard-coded paragraph.");
    const result = applyVisualOps(SAMPLE, [
      { op: "setText", nodeId: id, text: "Save 20% on {everything} <today>" },
    ]);
    assert.match(result.code, /\{"Save 20% on \{everything\} <today>"\}/);
  });

  it("setText on a var-bound element updates the prop default", () => {
    const id = idOf(tagged, "{headline}</Text>");
    const result = applyVisualOps(SAMPLE, [
      { op: "setText", nodeId: id, text: "Fresh headline" },
    ]);
    assert.match(result.code, /headline = 'Fresh headline'|headline = "Fresh headline"/);
    assert.deepEqual(result.variableUpdates, [
      { name: "headline", value: "Fresh headline" },
    ]);
  });

  it("delete removes the element", () => {
    const id = idOf(tagged, "<Button");
    const result = applyVisualOps(SAMPLE, [{ op: "delete", nodeId: id }]);
    assert.doesNotMatch(result.code, /<Button/);
    assert.deepEqual(result.summaries, ["Deleted <Button>"]);
  });

  it("refuses to delete protected elements", () => {
    const bodyId = (() => {
      // Body is intentionally untagged? No — Body is taggable, find its id from the AST pass.
      const line = tagComponentSource(SAMPLE)
        .split("\n")
        .find((l) => l.includes("<Body") && l.includes("data-m-id"));
      assert.ok(line);
      return line.match(/data-m-id="(\d+:\d+)"/)![1];
    })();
    assert.throws(
      () => applyVisualOps(SAMPLE, [{ op: "delete", nodeId: bodyId }]),
      /cannot be deleted/,
    );
  });

  it("refuses ops on dynamic elements", () => {
    const id = idOf(tagged, "<Column");
    assert.throws(
      () => applyVisualOps(SAMPLE, [{ op: "delete", nodeId: id }]),
      /rendered dynamically/,
    );
  });

  it("rejects unknown node ids", () => {
    assert.throws(
      () => applyVisualOps(SAMPLE, [{ op: "delete", nodeId: "999:0" }]),
      /no longer exists/,
    );
  });

  it("edited output recompiles cleanly end to end", () => {
    const id = idOf(tagged, "{headline}</Text>");
    const result = applyVisualOps(SAMPLE, [
      { op: "setText", nodeId: id, text: "Fresh headline" },
    ]);
    const service = new ReactToHtmlService();
    const html = service.compile(result.code, {});
    assert.match(html, /Fresh headline/);
  });
});

describe("extractElementSnippet", () => {
  it("returns the printed element", () => {
    const tagged = tagComponentSource(SAMPLE);
    const id = idOf(tagged, "<Button");
    const selected = extractElementSnippet(SAMPLE, id);
    assert.ok(selected);
    assert.equal(selected.name, "Button");
    assert.match(selected.snippet, /^<Button/);
    assert.match(selected.snippet, /\{ctaLabel\}/);
  });

  it("returns null for unknown ids", () => {
    assert.equal(extractElementSnippet(SAMPLE, "999:0"), null);
  });
});
