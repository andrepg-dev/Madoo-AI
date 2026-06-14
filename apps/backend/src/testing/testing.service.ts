import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  LinkCheckSchema,
  SendTestEmailResponseSchema,
  TestLinksResponseSchema,
  TestSpamResponseSchema,
  type LinkCheck,
  type SendTestEmailInput,
  type SendTestEmailResponse,
  type SpamIssue,
  type TestLinksResponse,
  type TestSpamResponse,
} from "@madoo/shared";
import juice from "juice";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";

const MAX_LINKS_CHECKED = 25;
const LINK_TIMEOUT_MS = 6000;

/** Marketing words that commonly trip spam filters. */
const SPAM_TRIGGER_WORDS = [
  "free",
  "winner",
  "congratulations",
  "guarantee",
  "act now",
  "click here",
  "limited time",
  "risk-free",
  "100%",
  "cash",
  "cheap",
  "order now",
  "buy now",
  "urgent",
  "no cost",
  "earn money",
  "double your",
  "this is not spam",
];

@Injectable()
export class TestingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private async loadLatestVariant(
    emailId: string,
    workspaceId: string,
  ): Promise<{ subject: string; compiledHtml: string }> {
    const variant = await this.prisma.emailVariant.findFirst({
      where: { emailId, workspaceId },
      orderBy: { seq: "desc" },
      select: { subject: true, compiledHtml: true },
    });
    if (!variant) {
      throw new NotFoundException("Email variant not found for this workspace.");
    }
    return variant;
  }

  async sendTestEmail(input: {
    emailId: string;
    workspaceId: string;
    userEmail: string;
    body: SendTestEmailInput;
  }): Promise<SendTestEmailResponse> {
    const to = input.body.to ?? input.userEmail;
    if (!to) {
      throw new BadRequestException("No recipient email available.");
    }

    const variant = await this.loadLatestVariant(input.emailId, input.workspaceId);

    const sent = await this.mail.sendTestEmail({
      to,
      subject: variant.subject,
      html: inlineCss(variant.compiledHtml),
    });

    return SendTestEmailResponseSchema.parse({
      ok: true,
      to,
      skipped: !sent,
    });
  }

  /** Extract, classify, and probe every link in the email's rendered HTML. */
  async checkLinks(emailId: string, workspaceId: string): Promise<TestLinksResponse> {
    const variant = await this.loadLatestVariant(emailId, workspaceId);
    const discovered = extractLinks(variant.compiledHtml).slice(0, MAX_LINKS_CHECKED);

    const links = await Promise.all(discovered.map((link) => probeLink(link)));

    const ok = links.filter((link) => link.ok).length;
    return TestLinksResponseSchema.parse({
      total: links.length,
      ok,
      broken: links.length - ok,
      checkedAt: new Date().toISOString(),
      links,
    });
  }

  /** Run deterministic deliverability heuristics over the email. */
  async checkSpam(emailId: string, workspaceId: string): Promise<TestSpamResponse> {
    const variant = await this.loadLatestVariant(emailId, workspaceId);
    const html = variant.compiledHtml;
    const subject = variant.subject ?? "";
    const text = htmlToText(html);
    const lowerText = text.toLowerCase();
    const lowerHtml = html.toLowerCase();

    const triggers = SPAM_TRIGGER_WORDS.filter((word) => lowerText.includes(word));
    const exclamations =
      (subject.match(/!/g) ?? []).length + (text.match(/!/g) ?? []).length;
    const letters = subject.replace(/[^a-zA-Z]/g, "");
    const upperRatio = letters.length
      ? letters.replace(/[^A-Z]/g, "").length / letters.length
      : 0;
    const shouting = upperRatio > 0.6 && letters.length > 4;
    const imageCount = (html.match(/<img\b/gi) ?? []).length;
    const linkCount = (html.match(/<a\b/gi) ?? []).length;
    const hasUnsubscribe = /unsubscribe|opt[- ]?out/i.test(lowerHtml);
    const altMissing = countImagesMissingAlt(html);
    const htmlBytes = Buffer.byteLength(html, "utf8");
    const riskyTags = ["script", "form", "iframe"].filter((tag) =>
      new RegExp(`<${tag}\\b`, "i").test(html),
    );

    const issues: SpamIssue[] = [
      {
        id: "trigger-words",
        label: "Spam trigger words",
        detail: triggers.length
          ? `Found ${triggers.length}: ${triggers.slice(0, 6).join(", ")}.`
          : "No common spam-trigger words detected.",
        severity: "high",
        passed: triggers.length <= 2,
      },
      {
        id: "subject-caps",
        label: "Subject not shouting",
        detail: shouting
          ? "Subject is mostly uppercase, which filters flag."
          : "Subject capitalization looks natural.",
        severity: "medium",
        passed: !shouting,
      },
      {
        id: "exclamations",
        label: "Reasonable punctuation",
        detail:
          exclamations > 4
            ? `${exclamations} exclamation marks across subject and body.`
            : "Exclamation usage is restrained.",
        severity: "low",
        passed: exclamations <= 4,
      },
      {
        id: "unsubscribe",
        label: "Unsubscribe link present",
        detail: hasUnsubscribe
          ? "An unsubscribe/opt-out link was found."
          : "No unsubscribe link — required for bulk sending and trust.",
        severity: "high",
        passed: hasUnsubscribe,
      },
      {
        id: "image-text-balance",
        label: "Text-to-image balance",
        detail:
          imageCount > 0 && text.length < 200
            ? "Mostly images with little text; image-only emails are penalized."
            : "Healthy amount of real text alongside images.",
        severity: "medium",
        passed: !(imageCount > 0 && text.length < 200),
      },
      {
        id: "alt-text",
        label: "Images have alt text",
        detail:
          altMissing > 0
            ? `${altMissing} image(s) missing alt text.`
            : "All images have alt text.",
        severity: "low",
        passed: altMissing === 0,
      },
      {
        id: "link-count",
        label: "Link count in range",
        detail:
          linkCount > 15
            ? `${linkCount} links — too many can look promotional.`
            : `${linkCount} link(s).`,
        severity: "low",
        passed: linkCount <= 15,
      },
      {
        id: "subject-length",
        label: "Subject length",
        detail: !subject.trim()
          ? "Subject is empty."
          : subject.length > 70
            ? `Subject is ${subject.length} chars; aim for under 70.`
            : `Subject is ${subject.length} chars.`,
        severity: "low",
        passed: Boolean(subject.trim()) && subject.length <= 70,
      },
      {
        id: "html-size",
        label: "Email size under clipping limit",
        detail:
          htmlBytes > 102_400
            ? `${Math.round(htmlBytes / 1024)}KB — Gmail clips messages over ~102KB, hiding content and the unsubscribe link.`
            : `${Math.round(htmlBytes / 1024)}KB, within Gmail's ~102KB limit.`,
        severity: "medium",
        passed: htmlBytes <= 102_400,
      },
      {
        id: "risky-elements",
        label: "No stripped or risky elements",
        detail: riskyTags.length
          ? `Found <${riskyTags.join(">, <")}> — most email clients strip these and they raise spam scores.`
          : "No script, form, or iframe elements.",
        severity: "high",
        passed: riskyTags.length === 0,
      },
    ];

    const penaltyBySeverity = { high: 22, medium: 12, low: 6 } as const;
    const penalty = issues
      .filter((issue) => !issue.passed)
      .reduce((sum, issue) => sum + penaltyBySeverity[issue.severity], 0);
    const score = Math.max(0, Math.min(100, 100 - penalty));
    const rating = score >= 80 ? "good" : score >= 55 ? "warning" : "poor";
    const failed = issues.filter((issue) => !issue.passed).length;

    return TestSpamResponseSchema.parse({
      score,
      rating,
      summary:
        failed === 0
          ? "No deliverability issues detected."
          : `${failed} issue${failed === 1 ? "" : "s"} could affect deliverability.`,
      issues,
    });
  }
}

function inlineCss(html: string): string {
  try {
    return juice(html);
  } catch {
    return html;
  }
}

type DiscoveredLink = { url: string; label: string };

/** Pull href + anchor text out of compiled HTML, de-duplicated by URL. */
function extractLinks(html: string): DiscoveredLink[] {
  const pattern = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set<string>();
  const links: DiscoveredLink[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html)) !== null) {
    const url = decodeHtmlEntities(match[1].trim());
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const label = htmlToText(match[2]).slice(0, 80) || url;
    links.push({ url, label });
  }
  return links;
}

function classifyLink(url: string): LinkCheck["kind"] {
  if (/^https?:\/\//i.test(url)) return "http";
  if (/^mailto:/i.test(url)) return "mailto";
  if (/^tel:/i.test(url)) return "tel";
  if (url.startsWith("#")) return "anchor";
  return "other";
}

/** Probe an http(s) link (HEAD, then GET) with a timeout; others pass through. */
async function probeLink(link: DiscoveredLink): Promise<LinkCheck> {
  const kind = classifyLink(link.url);
  const hasUtm = /[?&]utm_[a-z]+=/i.test(link.url);
  const base = { url: link.url, label: link.label, kind, hasUtm } as const;

  // Bare "#" hrefs (and javascript: stubs) are placeholders that go nowhere —
  // a common leftover in templates. Flag them as broken.
  const trimmed = link.url.trim();
  if (trimmed === "#" || /^javascript:/i.test(trimmed)) {
    return LinkCheckSchema.parse({
      ...base,
      status: null,
      ok: false,
      error: "Placeholder link",
    });
  }

  if (kind !== "http") {
    return LinkCheckSchema.parse({ ...base, status: null, ok: true, error: null });
  }

  for (const method of ["HEAD", "GET"] as const) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LINK_TIMEOUT_MS);
    try {
      const res = await fetch(link.url, {
        method,
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timer);
      // Some servers reject HEAD with 403/405 but serve GET fine; retry on GET.
      if (method === "HEAD" && (res.status === 405 || res.status === 403)) {
        continue;
      }
      return LinkCheckSchema.parse({
        ...base,
        status: res.status,
        ok: res.status < 400,
        error: null,
      });
    } catch (error) {
      clearTimeout(timer);
      if (method === "HEAD") continue;
      return LinkCheckSchema.parse({
        ...base,
        status: null,
        ok: false,
        error:
          error instanceof Error && error.name === "AbortError"
            ? "Timed out"
            : "Unreachable",
      });
    }
  }

  return LinkCheckSchema.parse({ ...base, status: null, ok: false, error: "Unreachable" });
}

function countImagesMissingAlt(html: string): number {
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  return imgs.filter((img) => !/\balt\s*=\s*["'][^"']*\S[^"']*["']/i.test(img)).length;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToText(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}
