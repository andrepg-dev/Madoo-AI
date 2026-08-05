import * as zlib from "node:zlib";

/**
 * Section divider images: the shaped boundary between two colored bands.
 *
 * CSS border-radius can only produce a symmetric dome, which reads as a plain
 * rounded corner. Real editorial dividers are asymmetric waves and tilts, and
 * no email-safe CSS can draw those: SVG is stripped by Gmail, clip-path is
 * unsupported, and data: URIs are blocked in Gmail's image sources. So the
 * shape is rasterized here into a plain PNG, hosted, and dropped in as a normal
 * <Img> — which every client renders, Outlook included.
 *
 * The PNG carries BOTH colors (band above the curve, band below), so it needs
 * no transparency and cannot leave a seam if it loads against an unexpected
 * background.
 *
 * Rasterized directly rather than through a headless browser: the shape is a
 * single-valued function of x, so a browser buys nothing and costs a process
 * launch per call.
 */

export const DIVIDER_SHAPES = [
  "wave",
  "wave-soft",
  "arc",
  "slant",
] as const;
export type DividerShape = (typeof DIVIDER_SHAPES)[number];

export type DividerOptions = {
  shape: DividerShape;
  /** Color of the band ABOVE the curve (the section the divider hangs from). */
  topColor: string;
  /** Color of the band BELOW the curve (the section the divider leads into). */
  bottomColor: string;
  /** Rendered width in px. 1200 = 600px email width at 2x for retina. */
  width?: number;
  height?: number;
  /** Mirror horizontally, so the same shape can lead in and out of a section. */
  flip?: boolean;
};

type Rgb = { r: number; g: number; b: number };

export function parseHexColor(input: string): Rgb {
  const value = input.trim().replace(/^#/, "");
  const expand = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return {
      r: expand(value[0]),
      g: expand(value[1]),
      b: expand(value[2]),
    };
  }
  if (/^[0-9a-f]{6}$/i.test(value)) {
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16),
    };
  }
  throw new Error(`Invalid hex color: ${input}`);
}

/**
 * Boundary height at horizontal position `t` (0..1), returned as a fraction of
 * the image height. Asymmetry is what separates these from a CSS radius: the
 * wave shapes stack two sine components at different frequencies so the crest
 * on one side sits higher than the other.
 */
function boundaryAt(shape: DividerShape, t: number): number {
  const TAU = Math.PI * 2;
  switch (shape) {
    case "wave":
      // Two crests of unequal height — the editorial "S" curve.
      return 0.5 + 0.3 * Math.sin(TAU * t - Math.PI / 2) + 0.16 * Math.sin(TAU * 2 * t);
    case "wave-soft":
      // One long, shallow swell. Calmer under dense content.
      return 0.5 + 0.26 * Math.sin(TAU * t - Math.PI / 2) + 0.06 * Math.sin(TAU * 2 * t + 1);
    case "arc":
      // Symmetric dome — the CSS-radius look, kept for continuity.
      return 0.12 + 0.88 * (1 - Math.sin(Math.PI * t));
    case "slant":
      return 0.12 + 0.76 * t;
    default:
      return 0.5;
  }
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

/** Minimal 8-bit truecolor PNG encoder — no alpha, so no dependency needed. */
function encodePng(width: number, height: number, rgb: Buffer): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type: truecolor
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  // Each scanline is prefixed with its filter byte (0 = none).
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    signature,
    pngChunk("IHDR", ihdrData),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/**
 * Render the divider. The boundary pixel of each column is blended by its
 * coverage fraction, which is what keeps the curve from looking like stairs at
 * the shallow angles these shapes spend most of their width in.
 */
export function renderDividerPng(options: DividerOptions): Buffer {
  const width = Math.max(2, Math.min(options.width ?? 1200, 2400));
  const height = Math.max(2, Math.min(options.height ?? 120, 600));
  const top = parseHexColor(options.topColor);
  const bottom = parseHexColor(options.bottomColor);

  const rgb = Buffer.alloc(width * height * 3);

  for (let x = 0; x < width; x += 1) {
    const t = width === 1 ? 0 : x / (width - 1);
    const boundary =
      boundaryAt(options.shape, options.flip ? 1 - t : t) * height;

    for (let y = 0; y < height; y += 1) {
      // Coverage of this pixel by the TOP band: 1 fully above the curve, 0
      // fully below, fractional exactly on it.
      const coverage = Math.max(0, Math.min(1, boundary - y));
      const offset = (y * width + x) * 3;
      rgb[offset] = Math.round(top.r * coverage + bottom.r * (1 - coverage));
      rgb[offset + 1] = Math.round(top.g * coverage + bottom.g * (1 - coverage));
      rgb[offset + 2] = Math.round(top.b * coverage + bottom.b * (1 - coverage));
    }
  }

  return encodePng(width, height, rgb);
}
