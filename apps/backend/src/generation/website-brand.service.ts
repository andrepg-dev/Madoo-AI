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

type TavilySearchImage = {
  url?: string;
  description?: string;
};

type TavilySearchResponse = {
  images?: Array<TavilySearchImage | string>;
};

type PexelsPhoto = {
  alt?: string;
  src?: {
    original?: string;
    large2x?: string;
    large?: string;
    medium?: string;
  };
};

type PexelsSearchResponse = {
  photos?: PexelsPhoto[];
};

export type ImageSearchResult = {
  url: string;
  description?: string;
};

type BrandImageCandidate = ImageSearchResult;

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
const MAX_BRAND_IMAGE_RESULTS = 20;
const MAX_BRAND_IMAGE_CRAWL_PAGES = 6;
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

function getNumericAttribute(tag: string, name: string): number | undefined {
  const raw = getAttribute(tag, name);
  if (!raw) return undefined;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : undefined;
}

function firstSrcsetUrl(raw: string | undefined): string | undefined {
  return raw?.split(",")[0]?.trim().split(/\s+/)[0];
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
  return extractImageCandidates(html, baseUrl)
    .map((candidate) => candidate.url)
    .slice(0, MAX_IMAGE_URLS);
}

function imageFilenameDescription(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    const filename = pathname.split("/").filter(Boolean).pop();
    if (!filename) return undefined;
    const withoutExtension = filename.replace(/\.[a-z0-9]+$/i, "");
    const cleaned = normalizeWhitespace(
      decodeURIComponent(withoutExtension)
        .replace(/[_-]+/g, " ")
        .replace(/\b\d{2,5}x\d{2,5}\b/gi, "")
        .replace(/\b\d{4,}\b/g, ""),
    );
    return cleaned || undefined;
  } catch {
    return undefined;
  }
}

function isExcludedBrandImage(
  url: string,
  metadata: string,
  width?: number,
  height?: number,
): boolean {
  const haystack = `${url} ${metadata}`.toLowerCase();
  if (/^data:/i.test(url)) return true;
  if (/\.(svg)(?:[?#].*)?$/i.test(url)) return true;
  if (
    /favicon|apple-touch-icon|icon-|sprite|tracking|pixel|spacer|blank|transparent|loader/i.test(
      haystack,
    )
  ) {
    return true;
  }
  if (width !== undefined && width <= 2) return true;
  if (height !== undefined && height <= 2) return true;
  if (
    width !== undefined &&
    height !== undefined &&
    width <= 80 &&
    height <= 80
  ) {
    return true;
  }
  return false;
}

function extractImageCandidates(
  html: string,
  baseUrl: string,
): BrandImageCandidate[] {
  const candidates: BrandImageCandidate[] = [];
  const imgTags = html.match(/<img\b[^>]*>/gi) ?? [];
  for (const [index, img] of imgTags.entries()) {
    const src =
      getAttribute(img, "src") ??
      getAttribute(img, "data-src") ??
      getAttribute(img, "data-original") ??
      getAttribute(img, "data-lazy-src") ??
      getAttribute(img, "data-image") ??
      firstSrcsetUrl(getAttribute(img, "srcset")) ??
      firstSrcsetUrl(getAttribute(img, "data-srcset"));
    const alt = normalizeWhitespace(getAttribute(img, "alt") ?? "");
    const className = getAttribute(img, "class") ?? "";
    const id = getAttribute(img, "id") ?? "";
    const width = getNumericAttribute(img, "width");
    const height = getNumericAttribute(img, "height");
    const absolute = absolutizeUrl(src, baseUrl);
    if (!absolute) continue;
    if (isExcludedBrandImage(absolute, `${alt} ${className} ${id}`, width, height)) {
      continue;
    }
    const description = alt || imageFilenameDescription(absolute);
    if (
      /logo|brand|hero|product|screenshot/i.test(
        `${absolute} ${alt} ${className} ${id}`,
      )
    ) {
      candidates.unshift({
        url: absolute,
        description,
      });
    } else {
      candidates.push({
        url: absolute,
        description,
      });
    }
  }
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

function extractBrandImageLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const links = html.match(/<a\b[^>]*>/gi) ?? [];
  const urls: string[] = [];
  for (const link of links) {
    const href = getAttribute(link, "href");
    const absolute = absolutizeUrl(href, baseUrl);
    if (!absolute) continue;
    const parsed = new URL(absolute);
    parsed.hash = "";
    if (parsed.origin !== base.origin) continue;
    if (!/products?|collections?|shop|catalog|new/i.test(parsed.pathname)) continue;
    urls.push(parsed.toString());
  }
  return unique(urls).slice(0, MAX_BRAND_IMAGE_CRAWL_PAGES);
}

function queryTerms(query?: string): string[] {
  return unique(
    normalizeWhitespace(query ?? "")
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((term) => term.length >= 3),
  );
}

function rankBrandImages(
  candidates: BrandImageCandidate[],
  query?: string,
): ImageSearchResult[] {
  const terms = queryTerms(query);
  return candidates
    .map((candidate, index) => {
      const haystack =
        `${candidate.description ?? ""} ${candidate.url}`.toLowerCase();
      const score = terms.reduce(
        (total, term) => total + (haystack.includes(term) ? 1 : 0),
        0,
      );
      return { candidate, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ candidate }) => ({
      url: candidate.url,
      description: candidate.description,
    }))
    .slice(0, MAX_BRAND_IMAGE_RESULTS);
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

/**
 * Pull font families straight from Google Fonts <link> tags in the page head.
 * This is the most reliable signal for the typeface a site actually uses: the
 * family is named in the href (`?family=Poppins:wght@400;700&family=Inter`),
 * so we catch it even when the stylesheet sits past the linked-CSS fetch cap or
 * the `font-family` rule never lands in the sampled CSS.
 */
function extractGoogleFonts(html: string): string[] {
  const fonts: string[] = [];
  const links = html.match(/<link\b[^>]*fonts\.googleapis\.com[^>]*>/gi) ?? [];
  for (const link of links) {
    const href = getAttribute(link, "href");
    if (!href) continue;
    // css2 allows repeated `family=` params; css (v1) joins them with `|`.
    const familyParams = href.match(/family=([^&"']+)/gi) ?? [];
    for (const param of familyParams) {
      const raw = param.slice("family=".length);
      for (const entry of raw.split("|")) {
        // Drop axis/weight spec after `:` and decode `+`/percent encoding.
        const name = decodeURIComponent(
          entry.split(":")[0].replace(/\+/g, " "),
        ).trim();
        if (name) fonts.push(name);
      }
    }
  }
  return unique(fonts);
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
      // Google Fonts <link> names win — they're the font the page actually
      // loads — then fall back to font-family rules in the sampled CSS.
      fonts: unique([
        ...extractGoogleFonts(html),
        ...extractFonts(styleText || html),
      ]).slice(0, MAX_FONTS),
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

  async findBrandImages(
    urlInput: string,
    query?: string,
  ): Promise<ImageSearchResult[]> {
    try {
      const parsedUrl = assertInspectableUrl(urlInput);
      await assertPublicResolvedHost(parsedUrl);
      const url = parsedUrl.toString();
      const html = await this.fetchHomepageHtml(url);
      if (!html) return [];

      const linkedPages = extractBrandImageLinks(html, url);
      const crawled = await Promise.allSettled(
        linkedPages.map(async (pageUrl) => ({
          url: pageUrl,
          html: await this.fetchHomepageHtml(pageUrl),
        })),
      );

      const candidates = [
        ...extractImageCandidates(html, url),
        ...crawled.flatMap((result) =>
          result.status === "fulfilled" && result.value.html
            ? extractImageCandidates(result.value.html, result.value.url)
            : [],
        ),
      ];

      const seen = new Set<string>();
      const deduped = candidates.filter((candidate) => {
        if (seen.has(candidate.url)) return false;
        seen.add(candidate.url);
        return true;
      });

      return rankBrandImages(deduped, query);
    } catch {
      return [];
    }
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

  /**
   * Search for real, hosted images matching a query. Tries Pexels first
   * (curated, stable CDN, free for commercial use), then falls back to Tavily
   * web image search. Returns direct image URLs the model can drop into an
   * <Img src>. Empty array when no key / no results — never throws on a miss.
   */
  async searchImages(query: string, count = 6): Promise<ImageSearchResult[]> {
    const q = query.trim();
    if (!q) return [];

    const pexels = await this.searchImagesPexels(q, count);
    if (pexels.length > 0) return pexels;

    return this.searchImagesTavily(q, count);
  }

  /**
   * Pexels image search — curated stock photos on a stable CDN, free for
   * commercial use with no attribution required. Empty array on no key / miss.
   */
  private async searchImagesPexels(
    query: string,
    count: number,
  ): Promise<ImageSearchResult[]> {
    const apiKey = this.config.get<string>("PEXELS_API_KEY");
    if (!apiKey) return [];

    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", String(Math.min(Math.max(count, 1), 80)));

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return [];
    }

    if (res.status === 401) {
      throw new InternalServerErrorException("PEXELS_API_KEY is invalid.");
    }
    if (!res.ok) return [];

    const data = (await res.json()) as PexelsSearchResponse;
    const out: ImageSearchResult[] = [];
    for (const photo of data.photos ?? []) {
      const src = photo.src;
      const picked =
        src?.large2x ?? src?.large ?? src?.original ?? src?.medium;
      if (typeof picked !== "string" || !/^https:\/\//i.test(picked)) continue;
      out.push({ url: picked, description: photo.alt || undefined });
      if (out.length >= count) break;
    }
    return out;
  }

  /**
   * Tavily web image search (fallback). Returns direct image URLs.
   * Empty array when no key / no results — never throws on a miss.
   */
  private async searchImagesTavily(
    query: string,
    count: number,
  ): Promise<ImageSearchResult[]> {
    const apiKey = this.config.get<string>("TAVILY_API_KEY");
    const q = query.trim();
    if (!apiKey || !q) return [];

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: q,
        include_images: true,
        include_image_descriptions: true,
        max_results: 1,
        search_depth: "basic",
        timeout: 10,
      }),
    });

    if (res.status === 401) {
      throw new InternalServerErrorException("TAVILY_API_KEY is invalid.");
    }
    if (!res.ok) return [];

    const data = (await res.json()) as TavilySearchResponse;
    const out: ImageSearchResult[] = [];
    for (const img of data.images ?? []) {
      const url = typeof img === "string" ? img : img.url;
      if (typeof url !== "string" || !/^https:\/\//i.test(url)) continue;
      out.push({
        url,
        description:
          typeof img === "object" && img.description
            ? img.description
            : undefined,
      });
      if (out.length >= count) break;
    }
    return out;
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
