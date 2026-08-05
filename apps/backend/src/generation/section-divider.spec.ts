import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as zlib from "node:zlib";
import {
  DIVIDER_SHAPES,
  parseBandColor,
  parseHexColor,
  renderDividerPng,
} from "./section-divider";

/** Decode our own PNG back to raw RGB so the tests assert on actual pixels. */
function decode(png: Buffer): {
  width: number;
  height: number;
  colorType: number;
  pixel: (
    x: number,
    y: number,
  ) => { r: number; g: number; b: number; a: number };
} {
  assert.deepEqual(
    [...png.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
    "png signature",
  );
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);

  // Walk the chunks to collect IDAT payloads.
  let offset = 8;
  const idat: Buffer[] = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    if (type === "IDAT") {
      idat.push(png.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }
  const colorType = png.readUInt8(25);
  const channels = colorType === 6 ? 4 : 3;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;

  return {
    width,
    height,
    colorType,
    pixel: (x, y) => {
      const rowStart = y * (stride + 1);
      assert.equal(raw[rowStart], 0, "expected filter byte 0");
      const at = rowStart + 1 + x * channels;
      return {
        r: raw[at],
        g: raw[at + 1],
        b: raw[at + 2],
        a: channels === 4 ? raw[at + 3] : 255,
      };
    },
  };
}

describe("section-divider", () => {
  it("parses 3- and 6-digit hex, with or without #", () => {
    assert.deepEqual(parseHexColor("#F2EDE4"), { r: 242, g: 237, b: 228 });
    assert.deepEqual(parseHexColor("fff"), { r: 255, g: 255, b: 255 });
    assert.throws(() => parseHexColor("rgb(1,2,3)"), /Invalid hex color/);
  });

  it("emits a decodable PNG of the requested size", () => {
    const png = renderDividerPng({
      shape: "wave",
      topColor: "#FFFFFF",
      bottomColor: "#8B85D9",
      width: 240,
      height: 60,
    });
    const image = decode(png);
    assert.equal(image.width, 240);
    assert.equal(image.height, 60);
  });

  it("paints the top color at the top edge and the bottom color at the bottom", () => {
    const png = renderDividerPng({
      shape: "wave",
      topColor: "#FFFFFF",
      bottomColor: "#8B85D9",
      width: 200,
      height: 80,
    });
    const image = decode(png);
    for (const x of [0, 60, 120, 199]) {
      assert.deepEqual(
        image.pixel(x, 0),
        { r: 255, g: 255, b: 255, a: 255 },
        `top edge at x=${x}`,
      );
      assert.deepEqual(
        image.pixel(x, 79),
        { r: 139, g: 133, b: 217, a: 255 },
        `bottom edge at x=${x}`,
      );
    }
  });

  it("produces an ASYMMETRIC boundary for wave shapes", () => {
    // The whole point: a CSS radius is mirror-symmetric, a real wave is not.
    // Compare the boundary depth at mirrored positions.
    const png = renderDividerPng({
      shape: "wave",
      topColor: "#000000",
      bottomColor: "#FFFFFF",
      width: 200,
      height: 100,
    });
    const image = decode(png);
    const depthAt = (x: number) => {
      for (let y = 0; y < 100; y += 1) {
        if (image.pixel(x, y).r > 127) return y;
      }
      return 100;
    };
    const left = depthAt(40);
    const right = depthAt(159);
    assert.notEqual(left, right);
    assert.ok(
      Math.abs(left - right) > 5,
      `expected a clearly asymmetric curve, got ${left} vs ${right}`,
    );
  });

  it("arc stays symmetric, so the old look is still available", () => {
    const png = renderDividerPng({
      shape: "arc",
      topColor: "#000000",
      bottomColor: "#FFFFFF",
      width: 201,
      height: 100,
    });
    const image = decode(png);
    const depthAt = (x: number) => {
      for (let y = 0; y < 100; y += 1) {
        if (image.pixel(x, y).r > 127) return y;
      }
      return 100;
    };
    assert.ok(Math.abs(depthAt(40) - depthAt(160)) <= 1);
  });

  it("flip mirrors the shape", () => {
    const base = decode(
      renderDividerPng({
        shape: "wave",
        topColor: "#000000",
        bottomColor: "#FFFFFF",
        width: 200,
        height: 100,
      }),
    );
    const flipped = decode(
      renderDividerPng({
        shape: "wave",
        topColor: "#000000",
        bottomColor: "#FFFFFF",
        width: 200,
        height: 100,
        flip: true,
      }),
    );
    const depth = (
      image: ReturnType<typeof decode>,
      x: number,
    ) => {
      for (let y = 0; y < 100; y += 1) {
        if (image.pixel(x, y).r > 127) return y;
      }
      return 100;
    };
    assert.equal(depth(base, 30), depth(flipped, 169));
  });

  it("renders every catalogued shape without throwing", () => {
    for (const shape of DIVIDER_SHAPES) {
      const png = renderDividerPng({
        shape,
        topColor: "#123456",
        bottomColor: "#abcdef",
        width: 120,
        height: 40,
      });
      assert.ok(png.length > 0, shape);
      assert.equal(decode(png).width, 120);
    }
  });

  it("clamps absurd dimensions instead of allocating unbounded buffers", () => {
    const png = renderDividerPng({
      shape: "wave",
      topColor: "#000000",
      bottomColor: "#FFFFFF",
      width: 99_999,
      height: 99_999,
    });
    const image = decode(png);
    assert.equal(image.width, 2400);
    assert.equal(image.height, 600);
  });

  describe("transparency", () => {
    it("keeps colorType 2 (no alpha channel) when both bands are solid", () => {
      const image = decode(
        renderDividerPng({
          shape: "wave",
          topColor: "#FFFFFF",
          bottomColor: "#8B85D9",
          width: 80,
          height: 40,
        }),
      );
      assert.equal(image.colorType, 2);
    });

    it("encodes alpha and clears the transparent band", () => {
      const image = decode(
        renderDividerPng({
          shape: "wave",
          topColor: "transparent",
          bottomColor: "#8B85D9",
          width: 200,
          height: 80,
        }),
      );
      assert.equal(image.colorType, 6);
      // Top edge is the see-through band, bottom edge is the solid one.
      assert.equal(image.pixel(100, 0).a, 0);
      assert.equal(image.pixel(100, 79).a, 255);
      assert.deepEqual(
        { r: image.pixel(100, 79).r, g: image.pixel(100, 79).g, b: image.pixel(100, 79).b },
        { r: 139, g: 133, b: 217 },
      );
    });

    it("works with the transparent band on the bottom too", () => {
      const image = decode(
        renderDividerPng({
          shape: "wave",
          topColor: "#8B85D9",
          bottomColor: "transparent",
          width: 200,
          height: 80,
        }),
      );
      assert.equal(image.pixel(100, 0).a, 255);
      assert.equal(image.pixel(100, 79).a, 0);
    });

    it("never blends the antialiased edge through black", () => {
      // A transparent band still needs RGB to blend toward, or the curve gets a
      // dark halo everywhere the alpha is partial.
      const image = decode(
        renderDividerPng({
          shape: "slant",
          topColor: "transparent",
          bottomColor: "#FFFFFF",
          width: 200,
          height: 80,
        }),
      );
      for (let y = 0; y < 80; y += 1) {
        for (const x of [50, 150]) {
          const p = image.pixel(x, y);
          assert.ok(
            p.r > 200 && p.g > 200 && p.b > 200,
            `dark halo at ${x},${y}: rgb(${p.r},${p.g},${p.b})`,
          );
        }
      }
    });

    it("rejects a divider with no color at all", () => {
      assert.throws(
        () =>
          renderDividerPng({
            shape: "wave",
            topColor: "transparent",
            bottomColor: "transparent",
          }),
        /at least one divider band/i,
      );
    });

    it("parseBandColor maps transparent to null, keeps hex", () => {
      assert.equal(parseBandColor("transparent"), null);
      assert.equal(parseBandColor("  TRANSPARENT "), null);
      assert.deepEqual(parseBandColor("#8B85D9"), { r: 139, g: 133, b: 217 });
    });
  });
});
