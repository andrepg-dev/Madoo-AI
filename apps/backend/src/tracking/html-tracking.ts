import { encodeClickToken, encodeOpenToken } from "./tracking-token";

export type TrackedLinkRow = {
  id: string;
  url: string;
};

export type LinkResolver = (originalUrl: string) => string | null;

const HREF_REGEX = /(<a\b[^>]*\bhref=)(["'])(.*?)\2/gi;

export function rewriteAnchorsAndInjectPixel(
  html: string,
  args: {
    deliveryId: string;
    secret: string;
    trackingBaseUrl: string;
    resolveLinkId: LinkResolver;
  },
): string {
  const rewritten = html.replace(HREF_REGEX, (match, attrPrefix, quote, href) => {
    if (!isTrackable(href)) return match;
    const linkId = args.resolveLinkId(href);
    if (!linkId) return match;
    const token = encodeClickToken(args.deliveryId, linkId, args.secret);
    const trackingUrl = `${args.trackingBaseUrl}/t/c/${token}`;
    return `${attrPrefix}${quote}${trackingUrl}${quote}`;
  });

  const openToken = encodeOpenToken(args.deliveryId, args.secret);
  const pixelUrl = `${args.trackingBaseUrl}/t/o/${openToken}.gif`;
  const pixelTag = `<img src="${pixelUrl}" alt="" width="1" height="1" border="0" style="display:block;width:1px;height:1px;border:0;outline:none;text-decoration:none;" />`;

  if (/<\/body\s*>/i.test(rewritten)) {
    return rewritten.replace(/<\/body\s*>/i, `${pixelTag}</body>`);
  }
  return `${rewritten}${pixelTag}`;
}

export function collectTrackableHrefs(html: string): string[] {
  const urls = new Set<string>();
  const regex = new RegExp(HREF_REGEX.source, HREF_REGEX.flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const href = match[3];
    if (isTrackable(href)) urls.add(href);
  }
  return Array.from(urls);
}

function isTrackable(href: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("#")) return false;
  if (trimmed.startsWith("mailto:")) return false;
  if (trimmed.startsWith("tel:")) return false;
  if (/^\{\{.*\}\}$/.test(trimmed)) return false;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  return true;
}
