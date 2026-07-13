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

function renderIconSvg(icon: IconSvgObject, color: string): Buffer {
  const body = icon
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
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none">${body}</svg>`,
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
  ): Promise<EmailIconAsset[]> {
    return Promise.all(
      [...new Set(names)].map((name) => this.getIcon(name, tone)),
    );
  }

  private getIcon(
    name: EmailIconName,
    tone: EmailIconTone,
  ): Promise<EmailIconAsset> {
    const cacheKey = `${name}:${tone}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const pending = this.createIcon(name, tone).catch((error) => {
      this.cache.delete(cacheKey);
      throw error;
    });
    this.cache.set(cacheKey, pending);
    return pending;
  }

  private async createIcon(
    name: EmailIconName,
    tone: EmailIconTone,
  ): Promise<EmailIconAsset> {
    const definition = ICONS[name];
    const module = await nativeImport(
      `@hugeicons/core-free-icons/${definition.moduleName}`,
    );
    const color = tone === "light" ? "#ffffff" : "#17181a";
    const png = await sharp(renderIconSvg(module.default, color))
      .png()
      .toBuffer();
    const key = `email-icons/v1/${name}-${tone}.png`;
    await this.s3.putObjectAtKey(key, png, "image/png");
    return {
      alt: definition.alt,
      name,
      url: this.s3.publicUrlForKey(key),
    };
  }
}
