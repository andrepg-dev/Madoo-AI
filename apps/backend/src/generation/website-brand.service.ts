import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

type TavilyExtractResult = {
  url?: string;
  raw_content?: string;
  images?: string[];
  favicon?: string;
};

type TavilyExtractResponse = {
  results?: TavilyExtractResult[];
  failed_results?: unknown[];
  usage?: { credits?: number };
};

type BrandColor = {
  hex: string;
  usage: "background" | "text" | "button" | "accent" | "unknown";
};

export type WebsiteBrandContext = {
  url: string;
  brandName?: string;
  title?: string;
  description?: string;
  faviconUrl?: string;
  logoUrl?: string;
  ogImageUrl?: string;
  colors: BrandColor[];
  fonts: string[];
  imageUrls: string[];
  ctas: string[];
  valueProps: string[];
  copySnippets: string[];
  styleNotes: string[];
  source: {
    htmlFetched: boolean;
    tavilyExtracted: boolean;
    tavilyCredits?: number;
  };
};

const MAX_CONTENT_CHARS = 3_500;
const MAX_IMAGE_URLS = 8;
const MAX_COPY_SNIPPETS = 6;
const MAX_COLORS = 10;
const MAX_FONTS = 6;
const MAX_CSS_BYTES = 80_000;
const REQUEST_TIMEOUT_MS = 8_000;
const PRIVATE_HOSTS = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);
const CTA_PATTERNS = [
  /get started/i,
  /start free/i,
  /try (it )?free/i,
  /book (a )?demo/i,
  /request (a )?demo/i,
  /contact sales/i,
  /sign up/i,
  /join now/i,
  /learn more/i,
  /shop now/i,
  /subscribe/i,
];

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function stripTags(input: string): string {
  return normalizeWhitespace(
    input
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function absolutizeUrl(raw: string | undefined, baseUrl: string): string | undefined {
  if (!raw?.trim()) return undefined;
  try {
    return new URL(raw.trim(), baseUrl).toString();
  } catch {
    return undefined;
  }
}

function getAttribute(tag: string, name: string): string | undefined {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i");
  return tag.match(re)?.[1];
}

function extractMeta(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const tag = html.match(pattern)?.[0];
    const content = tag ? getAttribute(tag, "content") : undefined;
    if (content) return normalizeWhitespace(content);
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const raw = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return raw ? stripTags(raw) : undefined;
}

function extractLinkHref(html: string, relPattern: RegExp, baseUrl: string): string | undefined {
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  for (const link of links) {
    const rel = getAttribute(link, "rel") ?? "";
    if (!relPattern.test(rel)) continue;
    const href = absolutizeUrl(getAttribute(link, "href"), baseUrl);
    if (href) return href;
  }
  return undefined;
}

function extractImageUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const img of imgTags) {
    const src = getAttribute(img, "src") ?? getAttribute(img, "data-src");
    const alt = getAttribute(img, "alt") ?? "";
    const className = getAttribute(img, "class") ?? "";
    const id = getAttribute(img, "id") ?? "";
    const absolute = absolutizeUrl(src, baseUrl);
    if (!absolute) continue;
    if (
      /logo|brand|hero|product|screenshot/i.test(
        `${absolute} ${alt} ${className} ${id}`,
      )
    ) {
      urls.unshift(absolute);
    } else {
      urls.push(absolute);
    }
  }
  return unique(urls).slice(0, MAX_IMAGE_URLS);
}

function extractLogoUrl(html: string, baseUrl: string, imageUrls: string[]): string | undefined {
  const logo = imageUrls.find((url) => /logo|brand/i.test(url));
  if (logo) return logo;
  const icon = extractLinkHref(html, /icon/i, baseUrl);
  return icon;
}

function normalizeHex(hex: string): string {
  const cleaned = hex.toLowerCase();
  if (cleaned.length !== 4) return cleaned;
  return `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`;
}

function extractColors(cssText: string): BrandColor[] {
  const matches = cssText.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
  const counts = new Map<string, number>();
  for (const match of matches.map(normalizeHex)) {
    if (match.length !== 7 && match.length !== 9) continue;
    if (["#ffffff", "#000000", "#f0f0f0", "#eeeeee", "#cccccc"].includes(match)) {
      continue;
    }
    counts.set(match, (counts.get(match) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_COLORS)
    .map(([hex]) => ({ hex, usage: "unknown" }));
}

function extractFonts(cssText: string): string[] {
  const fonts: string[] = [];
  const matches = cssText.match(/font-family\s*:\s*([^;}]+)/gi) ?? [];
  for (const match of matches) {
    const value = match.split(":").slice(1).join(":");
    for (const family of value.split(",")) {
      const cleaned = family.trim().replace(/^["']|["']$/g, "");
      if (
        !cleaned ||
        /^(sans-serif|serif|monospace|inherit|system-ui|ui-)/i.test(cleaned)
      ) {
        continue;
      }
      fonts.push(cleaned);
    }
  }
  return unique(fonts).slice(0, MAX_FONTS);
}

function extractCtas(text: string): string[] {
  const chunks = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map(normalizeWhitespace)
    .filter((chunk) => chunk.length >= 4 && chunk.length <= 90);
  return unique(
    chunks.filter((chunk) => CTA_PATTERNS.some((pattern) => pattern.test(chunk))),
  ).slice(0, 6);
}

function extractValueProps(text: string): string[] {
  return unique(
    text
      .split(/(?<=[.!?])\s+|\n+/)
      .map(normalizeWhitespace)
      .filter((chunk) => chunk.length >= 35 && chunk.length <= 180),
  ).slice(0, MAX_COPY_SNIPPETS);
}

function assertInspectableUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new BadRequestException("Website URL is invalid.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new BadRequestException("Website URL must use http or https.");
  }

  const hostname = url.hostname.toLowerCase();
  const hostForIpCheck = hostname.replace(/^\[|\]$/g, "");
  if (
    PRIVATE_HOSTS.has(hostForIpCheck) ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".test")
  ) {
    throw new BadRequestException("Private or local website URLs are not allowed.");
  }

  const ipKind = isIP(hostForIpCheck);
  if (ipKind === 4) {
    const [a, b] = hostForIpCheck.split(".").map(Number);
    if (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254)
    ) {
      throw new BadRequestException("Private IP website URLs are not allowed.");
    }
  }
  if (ipKind === 6) {
    throw new BadRequestException("IP literal website URLs are not allowed.");
  }

  return url;
}

function isPrivateIpAddress(address: string): boolean {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  const ipKind = isIP(normalized);
  if (ipKind === 4) {
    const [a, b] = normalized.split(".").map(Number);
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    );
  }
  if (ipKind === 6) {
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }
  return false;
}

async function assertPublicResolvedHost(url: URL): Promise<void> {
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      throw new BadRequestException("Private IP website URLs are not allowed.");
    }
    return;
  }

  try {
    const addresses = await lookup(hostname, { all: true });
    if (addresses.some((entry) => isPrivateIpAddress(entry.address))) {
      throw new BadRequestException("Website URL resolves to a private IP.");
    }
  } catch (err) {
    if (err instanceof BadRequestException) throw err;
    throw new BadRequestException("Website hostname could not be resolved.");
  }
}

@Injectable()
export class WebsiteBrandService {
  constructor(private readonly config: ConfigService) {}

  async inspect(urlInput: string, purpose?: string): Promise<WebsiteBrandContext> {
    const parsedUrl = assertInspectableUrl(urlInput);
    await assertPublicResolvedHost(parsedUrl);
    const url = parsedUrl.toString();
    const [htmlResult, tavilyResult] = await Promise.allSettled([
      this.fetchHomepageHtml(url),
      this.extractWithTavily(url, purpose),
    ]);
    if (
      tavilyResult.status === "rejected" &&
      tavilyResult.reason instanceof InternalServerErrorException
    ) {
      throw tavilyResult.reason;
    }

    const html = htmlResult.status === "fulfilled" ? htmlResult.value : "";
    const tavily = tavilyResult.status === "fulfilled" ? tavilyResult.value : null;
    const extracted = tavily?.results?.[0];
    const rawContent = normalizeWhitespace(
      (extracted?.raw_content ?? "").slice(0, MAX_CONTENT_CHARS),
    );
    const visibleText = normalizeWhitespace(
      [stripTags(html).slice(0, MAX_CONTENT_CHARS), rawContent]
        .filter(Boolean)
        .join(" "),
    );
    const imageUrls = unique([
      ...extractImageUrls(html, url),
      ...(extracted?.images ?? [])
        .map((imageUrl) => absolutizeUrl(imageUrl, url))
        .filter(Boolean),
    ] as string[]).slice(0, MAX_IMAGE_URLS);
    const styleText = html ? await this.collectStyleText(html, url) : "";
    const title = extractTitle(html) ?? extractMeta(html, "og:title");
    const description =
      extractMeta(html, "description") ??
      extractMeta(html, "og:description") ??
      extractValueProps(visibleText)[0];

    return {
      url,
      brandName: extractMeta(html, "og:site_name") ?? title?.split(/[|-]/)[0]?.trim(),
      title,
      description,
      faviconUrl:
        absolutizeUrl(extracted?.favicon, url) ??
        extractLinkHref(html, /icon|shortcut icon|apple-touch-icon/i, url),
      logoUrl: extractLogoUrl(html, url, imageUrls),
      ogImageUrl: absolutizeUrl(extractMeta(html, "og:image"), url),
      colors: extractColors(styleText || html),
      fonts: extractFonts(styleText || html),
      imageUrls,
      ctas: extractCtas(visibleText),
      valueProps: extractValueProps(visibleText),
      copySnippets: extractValueProps(rawContent || visibleText),
      styleNotes: this.buildStyleNotes(styleText, imageUrls),
      source: {
        htmlFetched: Boolean(html),
        tavilyExtracted: Boolean(extracted),
        tavilyCredits: tavily?.usage?.credits,
      },
    };
  }

  private async fetchHomepageHtml(url: string, redirects = 0): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "MadooAIBrandInspector/1.0",
          Accept: "text/html,application/xhtml+xml",
        },
      });
      if (res.status >= 300 && res.status < 400 && redirects < 2) {
        const nextUrl = absolutizeUrl(res.headers.get("location") ?? undefined, url);
        if (!nextUrl) return "";
        const parsed = assertInspectableUrl(nextUrl);
        await assertPublicResolvedHost(parsed);
        return this.fetchHomepageHtml(parsed.toString(), redirects + 1);
      }
      if (!res.ok) return "";
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html")) return "";
      return (await res.text()).slice(0, 250_000);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async collectStyleText(html: string, baseUrl: string): Promise<string> {
    const inlineStyles = (html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi) ?? [])
      .map((block) => block.replace(/<\/?style[^>]*>/gi, ""))
      .join("\n");

    const stylesheetLinks = (html.match(/<link\b[^>]*>/gi) ?? [])
      .filter((link) => /stylesheet/i.test(getAttribute(link, "rel") ?? ""))
      .map((link) => absolutizeUrl(getAttribute(link, "href"), baseUrl))
      .filter(Boolean)
      .slice(0, 3) as string[];

    const cssResponses = await Promise.allSettled(
      stylesheetLinks.map((href) => this.fetchCss(href)),
    );
    const linkedCss = cssResponses
      .map((result) => (result.status === "fulfilled" ? result.value : ""))
      .join("\n");

    return `${inlineStyles}\n${linkedCss}`.slice(0, MAX_CSS_BYTES);
  }

  private async fetchCss(url: string, redirects = 0): Promise<string> {
    const parsed = assertInspectableUrl(url);
    await assertPublicResolvedHost(parsed);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "MadooAIBrandInspector/1.0",
          Accept: "text/css,*/*;q=0.8",
        },
      });
      if (res.status >= 300 && res.status < 400 && redirects < 2) {
        const nextUrl = absolutizeUrl(
          res.headers.get("location") ?? undefined,
          parsed.toString(),
        );
        if (!nextUrl) return "";
        return this.fetchCss(nextUrl, redirects + 1);
      }
      if (!res.ok) return "";
      return (await res.text()).slice(0, MAX_CSS_BYTES);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async extractWithTavily(
    url: string,
    purpose?: string,
  ): Promise<TavilyExtractResponse | null> {
    const apiKey = this.config.get<string>("TAVILY_API_KEY");
    if (!apiKey) return null;

    const res = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: url,
        query:
          purpose ??
          "brand positioning, product value proposition, calls to action, email marketing context",
        chunks_per_source: 5,
        extract_depth: "basic",
        include_images: true,
        include_favicon: true,
        include_usage: true,
        format: "markdown",
        timeout: 10,
      }),
    });

    if (res.status === 401) {
      throw new InternalServerErrorException("TAVILY_API_KEY is invalid.");
    }
    if (!res.ok) return null;
    return (await res.json()) as TavilyExtractResponse;
  }

  private buildStyleNotes(styleText: string, imageUrls: string[]): string[] {
    const notes: string[] = [];
    if (/border-radius\s*:\s*(?:1[2-9]|[2-9]\d)px/i.test(styleText)) {
      notes.push("Uses rounded UI surfaces.");
    }
    if (/gradient/i.test(styleText)) {
      notes.push("Uses gradients in visual system.");
    }
    if (imageUrls.some((url) => /product|screenshot|app|dashboard/i.test(url))) {
      notes.push("Has product/app imagery available by URL.");
    }
    if (imageUrls.some((url) => /logo|brand/i.test(url))) {
      notes.push("Has logo/brand image available by URL.");
    }
    return notes.slice(0, 4);
  }
}
