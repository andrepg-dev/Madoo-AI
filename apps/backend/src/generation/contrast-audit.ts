import * as React from "react";

/**
 * Static contrast audit for a generated email component.
 *
 * Prompt rules alone did not stop the model shipping invisible content: light
 * cards keeping light text inside a dark email, dark buttons on dark sections,
 * and offer panels sitting a shade or two from the block behind them. Those are
 * judgment calls the model gets wrong even when told explicitly, so they are
 * checked deterministically here and fed back through the existing
 * validate-and-retry loop.
 *
 * The audit walks the React element tree BEFORE rendering — react-email
 * components are not invoked, so `props.style` is exactly what the model
 * authored, and parent/child nesting gives the effective background without
 * needing an HTML parser or a DOM.
 *
 * CALIBRATION: the thresholds are deliberately far below WCAG. This is not an
 * accessibility linter and must never police design — a false positive costs a
 * whole extra generation round-trip. It only catches text or CTAs that are
 * effectively invisible. For reference: white on #F2EDE4 is 1.11 and #1A1A1A on
 * #141414 is 1.06 (both caught), while a muted #999 footer on white is 2.85 and
 * a light-gray #B0B0B0 label on #141414 is 8.9 (both pass untouched).
 */

/** Text below this ratio against its own background is unreadable, not merely low-contrast. */
const TEXT_MIN_RATIO = 2.0;
/** A filled CTA whose fill is this close to the surface behind it reads as no button at all. */
const BUTTON_MIN_RATIO = 1.5;

export type ContrastFinding = {
  kind: "text" | "button";
  /** react-email component name the problem sits on, e.g. Text, Heading, Button. */
  component: string;
  foreground: string;
  background: string;
  ratio: number;
  /** Short excerpt so the model can locate the element in its own code. */
  sample: string;
};

const NAMED_COLORS: Record<string, [number, number, number]> = {
  white: [255, 255, 255],
  black: [0, 0, 0],
  red: [255, 0, 0],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
};

type Rgb = { r: number; g: number; b: number; a: number };

/** Parse hex / rgb() / rgba() / a few named colors. Returns null when unknown — unknown is always skipped. */
export function parseColor(input: unknown): Rgb | null {
  if (typeof input !== "string") return null;
  const value = input.trim().toLowerCase();
  if (!value || value === "transparent" || value === "inherit" || value === "currentcolor") {
    return null;
  }

  const named = NAMED_COLORS[value];
  if (named) return { r: named[0], g: named[1], b: named[2], a: 1 };

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    const expand = (s: string) => parseInt(s.length === 1 ? s + s : s, 16);
    if (hex.length === 3 || hex.length === 4) {
      return {
        r: expand(hex[0]),
        g: expand(hex[1]),
        b: expand(hex[2]),
        a: hex.length === 4 ? expand(hex[3]) / 255 : 1,
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
      };
    }
    return null;
  }

  const fn = value.match(/^rgba?\(([^)]+)\)$/);
  if (fn) {
    const parts = fn[1].split(/[,/\s]+/).filter(Boolean).map(Number);
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
    return {
      r: parts[0],
      g: parts[1],
      b: parts[2],
      a: parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1,
    };
  }

  return null;
}

/** Composite a translucent color over an opaque backdrop. */
function flatten(color: Rgb, backdrop: Rgb): Rgb {
  if (color.a >= 1) return color;
  return {
    r: color.r * color.a + backdrop.r * (1 - color.a),
    g: color.g * color.a + backdrop.g * (1 - color.a),
    b: color.b * color.a + backdrop.b * (1 - color.a),
    a: 1,
  };
}

function luminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function formatColor(c: Rgb): string {
  const hex = (v: number) =>
    Math.round(Math.max(0, Math.min(255, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${hex(c.r)}${hex(c.g)}${hex(c.b)}`.toUpperCase();
}

type Style = Record<string, unknown>;

function styleOf(element: React.ReactElement): Style {
  const style = (element.props as { style?: unknown } | null)?.style;
  return style && typeof style === "object" ? (style as Style) : {};
}

/**
 * react-email ships every component as a forwardRef object carrying a
 * displayName, so a function-only check finds nothing. Handles plain host tags,
 * function components, and forwardRef/memo wrappers alike.
 */
function componentName(type: unknown): string {
  if (typeof type === "string") return type;
  if (typeof type === "function") {
    const fn = type as { displayName?: string; name?: string };
    return fn.displayName ?? fn.name ?? "Component";
  }
  if (type && typeof type === "object") {
    const wrapper = type as {
      displayName?: string;
      render?: { displayName?: string; name?: string };
      type?: unknown;
    };
    if (wrapper.displayName) return wrapper.displayName;
    if (wrapper.render) return wrapper.render.displayName ?? wrapper.render.name ?? "Component";
    if (wrapper.type) return componentName(wrapper.type);
  }
  return "Unknown";
}

/** A background-image or gradient means we cannot know the backdrop — skip the subtree rather than guess. */
function hasUnknownBackdrop(style: Style): boolean {
  const candidates = [style.backgroundImage, style.background];
  return candidates.some(
    (v) => typeof v === "string" && /url\(|gradient\(/i.test(v),
  );
}

function backgroundOf(style: Style): Rgb | null {
  const direct = parseColor(style.backgroundColor);
  if (direct) return direct;
  const shorthand = style.background;
  if (typeof shorthand === "string" && !/url\(|gradient\(/i.test(shorthand)) {
    return parseColor(shorthand);
  }
  return null;
}

/** Preheader text and mso-only blocks are hidden on purpose; auditing them is pure noise. */
function isVisuallyHidden(style: Style, name: string): boolean {
  if (name === "Preview" || name === "Head" || name === "Font" || name === "style") {
    return true;
  }
  if (typeof style.display === "string" && style.display.toLowerCase() === "none") return true;
  if (style.opacity === 0 || style.opacity === "0") return true;
  const zero = (v: unknown) => v === 0 || v === "0" || v === "0px";
  if (zero(style.fontSize) || zero(style.maxHeight)) return true;
  return false;
}

function directText(element: React.ReactElement): string {
  const children = (element.props as { children?: React.ReactNode } | null)?.children;
  const parts: string[] = [];
  React.Children.toArray(children).forEach((child) => {
    if (typeof child === "string" || typeof child === "number") {
      parts.push(String(child));
    }
  });
  return parts.join("").replace(/\s+/g, " ").trim();
}

function hasVisibleBorder(style: Style): boolean {
  const keys = ["border", "borderTop", "borderBottom", "borderLeft", "borderRight", "borderWidth", "borderColor"];
  return keys.some((k) => {
    const v = style[k];
    return typeof v === "string" && v.trim() !== "" && !/^0(px)?\s|none/i.test(v);
  });
}

type WalkContext = {
  color: Rgb | null;
  background: Rgb | null;
  backdropUnknown: boolean;
};

/**
 * Audit a compiled email component. Never throws: an auditor that can break a
 * generation is worse than one that misses a case, so any unexpected shape
 * (class component, hooks, exotic children) simply yields no findings.
 */
export function auditContrast(
  Component: React.ComponentType<Record<string, unknown>>,
  variables: Record<string, unknown> = {},
): ContrastFinding[] {
  let tree: React.ReactNode;
  try {
    tree = (Component as (props: Record<string, unknown>) => React.ReactNode)(variables);
  } catch {
    return [];
  }

  const findings: ContrastFinding[] = [];
  const seen = new Set<string>();

  const record = (finding: ContrastFinding) => {
    // One report per distinct color pair — a repeated palette mistake is one
    // fix, and a wall of duplicates would drown the retry prompt.
    const key = `${finding.kind}|${finding.foreground}|${finding.background}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push(finding);
  };

  const walk = (node: React.ReactNode, ctx: WalkContext, depth: number): void => {
    if (depth > 80 || node === null || node === undefined) return;

    if (Array.isArray(node)) {
      node.forEach((child) => walk(child, ctx, depth + 1));
      return;
    }
    if (!React.isValidElement(node)) return;

    const element = node as React.ReactElement;
    const name = componentName(element.type);
    const style = styleOf(element);
    if (isVisuallyHidden(style, name)) return;

    const ownBackground = backgroundOf(style);
    const nextCtx: WalkContext = {
      color: parseColor(style.color) ?? ctx.color,
      background: ownBackground ?? ctx.background,
      backdropUnknown: hasUnknownBackdrop(style)
        ? true
        : ownBackground
          ? false
          : ctx.backdropUnknown,
    };

    // A filled CTA that barely differs from the surface behind it is invisible
    // as an object even when its own label is perfectly legible.
    if (
      name === "Button" &&
      ownBackground &&
      ownBackground.a >= 1 &&
      ctx.background &&
      !ctx.backdropUnknown &&
      !hasVisibleBorder(style)
    ) {
      const ratio = contrastRatio(ownBackground, ctx.background);
      if (ratio < BUTTON_MIN_RATIO) {
        record({
          kind: "button",
          component: name,
          foreground: formatColor(ownBackground),
          background: formatColor(ctx.background),
          ratio,
          sample: directText(element).slice(0, 60) || "(button)",
        });
      }
    }

    const text = directText(element);
    if (text && nextCtx.color && nextCtx.background && !nextCtx.backdropUnknown) {
      const bg = nextCtx.background.a >= 1
        ? nextCtx.background
        : flatten(nextCtx.background, { r: 255, g: 255, b: 255, a: 1 });
      const fg = flatten(nextCtx.color, bg);
      const ratio = contrastRatio(fg, bg);
      if (ratio < TEXT_MIN_RATIO) {
        record({
          kind: "text",
          component: name,
          foreground: formatColor(fg),
          background: formatColor(bg),
          ratio,
          sample: text.slice(0, 60),
        });
      }
    }

    const children = (element.props as { children?: React.ReactNode } | null)?.children;
    React.Children.toArray(children).forEach((child) => walk(child, nextCtx, depth + 1));
  };

  try {
    walk(tree, { color: null, background: null, backdropUnknown: false }, 0);
  } catch {
    return [];
  }
  return findings;
}

/** Turn findings into retry feedback the model can act on directly. */
export function formatContrastFeedback(findings: ContrastFinding[]): string {
  const lines = findings.map((f) =>
    f.kind === "button"
      ? `- <Button> "${f.sample}" has backgroundColor ${f.foreground} on a ${f.background} surface (contrast ${f.ratio.toFixed(2)}:1) — the button is invisible against the section behind it.`
      : `- <${f.component}> "${f.sample}" uses color ${f.foreground} on background ${f.background} (contrast ${f.ratio.toFixed(2)}:1) — this text is unreadable.`,
  );
  return [
    "Contrast check failed: the email contains content that is effectively invisible.",
    ...lines,
    "Fix by changing the colors of the affected elements, not their text: a light surface takes dark text (#141414-#333) and a dark surface takes light text (#E8E8E8-#FFFFFF); a filled button must contrast strongly with the section behind it. When you change a container's background, restate the color of every text, border, and button inside it.",
  ].join("\n");
}
