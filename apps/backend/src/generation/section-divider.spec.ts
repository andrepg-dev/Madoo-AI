import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as zlib from "node:zlib";
import {
  DIVIDER_SHAPES,
  parseHexColor,
  renderDividerPng,
} from "./section-divider";

/** Decode our own PNG back to raw RGB so the tests assert on actual pixels. */
function decode(png: Buffer): {
  width: number;
  height: number;
  pixel: (x: number, y: number) => { r: number; g: number; b: number };
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
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 3;

  return {
    width,
    height,
    pixel: (x, y) => {
      const rowStart = y * (stride + 1);
      assert.equal(raw[rowStart], 0, "expected filter byte 0");
      const at = rowStart + 1 + x * 3;
      return { r: raw[at], g: raw[at + 1], b: raw[at + 2] };
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
        { r: 255, g: 255, b: 255 },
        `top edge at x=${x}`,
      );
      assert.deepEqual(
        image.pixel(x, 79),
        { r: 139, g: 133, b: 217 },
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
});
