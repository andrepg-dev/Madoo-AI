import { Injectable } from "@nestjs/common";
import sharp from "sharp";
import { S3Service } from "../s3/s3.service";

type IconSvgObject = readonly (readonly [
  string,
  Readonly<Record<string, string | number>>,
])[];

export const EMAIL_ICON_NAMES = [
  "arrow-right",
  "calendar",
  "check",
  "clock",
  "delivery",
  "facebook",
  "gift",
  "globe",
  "heart",
  "instagram",
  "linkedin",
  "location",
  "mail",
  "phone",
  "security",
  "shopping-bag",
  "star",
  "user",
  "x-social",
  "zap",
] as const;

export type EmailIconName = (typeof EMAIL_ICON_NAMES)[number];
export type EmailIconTone = "dark" | "light";
/**
 * outline — the bare stroke glyph (original catalog look).
 * badge — the glyph reversed out of a filled circle ("shaped" icons); the
 * circle color defaults to the tone but can be any brand hex.
 */
export type EmailIconStyle = "outline" | "badge";

type IconDefinition = {
  alt: string;
  moduleName: string;
};

const ICONS: Record<EmailIconName, IconDefinition> = {
  "arrow-right": { alt: "Arrow right", moduleName: "ArrowRight02Icon" },
  calendar: { alt: "Calendar", moduleName: "Calendar03Icon" },
  check: { alt: "Checkmark", moduleName: "CheckmarkCircle02Icon" },
  clock: { alt: "Clock", moduleName: "Clock01Icon" },
  delivery: { alt: "Delivery truck", moduleName: "DeliveryTruck01Icon" },
  facebook: { alt: "Facebook", moduleName: "Facebook02Icon" },
  gift: { alt: "Gift", moduleName: "GiftIcon" },
  globe: { alt: "Website", moduleName: "Globe02Icon" },
  heart: { alt: "Heart", moduleName: "HeartCheckIcon" },
  instagram: { alt: "Instagram", moduleName: "InstagramIcon" },
  linkedin: { alt: "LinkedIn", moduleName: "Linkedin02Icon" },
  location: { alt: "Location", moduleName: "Location01Icon" },
  mail: { alt: "Email", moduleName: "Mail01Icon" },
  phone: { alt: "Phone", moduleName: "TelephoneIcon" },
  security: { alt: "Security", moduleName: "SecurityCheckIcon" },
  "shopping-bag": { alt: "Shopping bag", moduleName: "ShoppingBag01Icon" },
  star: { alt: "Star", moduleName: "StarIcon" },
  user: { alt: "Person", moduleName: "UserIcon" },
  "x-social": { alt: "X", moduleName: "NewTwitterIcon" },
  zap: { alt: "Lightning", moduleName: "ZapIcon" },
};

// TypeScript CommonJS output rewrites import() to require(), but Hugeicons'
// CommonJS entry is empty. Native import loads only trusted mapped ESM modules.
const nativeImport = new Function(
  "specifier",
  "return import(specifier)",
) as (specifier: string) => Promise<{ default: IconSvgObject }>;

const SVG_ATTRIBUTE_NAMES: Record<string, string> = {
  clipRule: "clip-rule",
  fillRule: "fill-rule",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  strokeMiterlimit: "stroke-miterlimit",
  strokeWidth: "stroke-width",
};

function escapeXml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderIconBody(icon: IconSvgObject, color: string): string {
  return icon
    .map(([tag, attributes]) => {
      const attrs = Object.entries(attributes)
        .filter(([name]) => name !== "key")
        .map(([name, value]) => {
          const attributeName = SVG_ATTRIBUTE_NAMES[name] ?? name;
          const attributeValue = value === "currentColor" ? color : value;
          return `${attributeName}="${escapeXml(attributeValue)}"`;
        })
        .join(" ");
      return `<${tag} ${attrs} />`;
    })
    .join("");
}

function renderIconSvg(icon: IconSvgObject, color: string): Buffer {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none">${renderIconBody(icon, color)}</svg>`,
  );
}

/** Perceived luminance decides whether the glyph reverses to white or dark. */
function glyphColorFor(fill: string): string {
  const r = parseInt(fill.slice(1, 3), 16);
  const g = parseInt(fill.slice(3, 5), 16);
  const b = parseInt(fill.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#17181a" : "#ffffff";
}

function renderBadgeSvg(icon: IconSvgObject, fill: string): Buffer {
  const glyph = renderIconBody(icon, glyphColorFor(fill));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="16" fill="${escapeXml(fill)}"/><g transform="translate(6.4 6.4) scale(0.8)">${glyph}</g></svg>`,
  );
}

export type EmailIconAsset = {
  alt: string;
  name: EmailIconName;
  url: string;
};

@Injectable()
export class EmailIconCatalogService {
  private readonly cache = new Map<string, Promise<EmailIconAsset>>();

  constructor(private readonly s3: S3Service) {}

  getIcons(
    names: readonly EmailIconName[],
    tone: EmailIconTone,
    style: EmailIconStyle = "outline",
    badgeColor?: string,
  ): Promise<EmailIconAsset[]> {
    return Promise.all(
      [...new Set(names)].map((name) =>
        this.getIcon(name, tone, style, badgeColor),
      ),
    );
  }

  private getIcon(
    name: EmailIconName,
    tone: EmailIconTone,
    style: EmailIconStyle,
    badgeColor?: string,
  ): Promise<EmailIconAsset> {
    const fill = this.badgeFill(tone, badgeColor);
    const cacheKey =
      style === "badge" ? `${name}:badge:${fill}` : `${name}:${tone}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const pending = this.createIcon(name, tone, style, fill).catch((error) => {
      this.cache.delete(cacheKey);
      throw error;
    });
    this.cache.set(cacheKey, pending);
    return pending;
  }

  private badgeFill(tone: EmailIconTone, badgeColor?: string): string {
    if (badgeColor && /^#[0-9a-f]{6}$/i.test(badgeColor)) {
      return badgeColor.toLowerCase();
    }
    return tone === "light" ? "#ffffff" : "#17181a";
  }

  private async createIcon(
    name: EmailIconName,
    tone: EmailIconTone,
    style: EmailIconStyle,
    badgeFill: string,
  ): Promise<EmailIconAsset> {
    const definition = ICONS[name];
    const module = await nativeImport(
      `@hugeicons/core-free-icons/${definition.moduleName}`,
    );
    const svg =
      style === "badge"
        ? renderBadgeSvg(module.default, badgeFill)
        : renderIconSvg(
            module.default,
            tone === "light" ? "#ffffff" : "#17181a",
          );
    const png = await sharp(svg).png().toBuffer();
    const key =
      style === "badge"
        ? `email-icons/v1/${name}-badge-${badgeFill.slice(1)}.png`
        : `email-icons/v1/${name}-${tone}.png`;
    await this.s3.putObjectAtKey(key, png, "image/png");
    return {
      alt: definition.alt,
      name,
      url: this.s3.publicUrlForKey(key),
    };
  }
}
