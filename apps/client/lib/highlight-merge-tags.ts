const MERGE_TAG_PATTERN = /\{\{[^}]+\}\}/;
const MERGE_TAG_SPLIT = /(\{\{[^}]+\}\})/g;
const MERGE_TAG_STYLE =
  "color:#2f6fea;background:rgba(47,111,234,0.12);border-radius:3px;padding:0 3px;font-weight:600;";

/**
 * Wrap `{{variable}}` merge tags (dynamic variables) in colored spans so they
 * stand out in an email preview. Preview-only — only touches body text nodes,
 * never attributes (so `href="{{ctaUrl}}"` stays intact) or the exported HTML.
 *
 * Single source of truth: every place that renders an email preview should go
 * through this (via `EmailPreviewFrame`) so the highlight stays consistent.
 */
export function highlightMergeTags(html: string | null): string | null {
  if (!html || typeof window === "undefined" || !html.includes("{{")) {
    return html;
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const targets: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeValue && MERGE_TAG_PATTERN.test(node.nodeValue)) {
      targets.push(node as Text);
    }
  }

  for (const textNode of targets) {
    const fragment = doc.createDocumentFragment();
    for (const part of textNode.nodeValue!.split(MERGE_TAG_SPLIT)) {
      if (!part) continue;
      if (MERGE_TAG_PATTERN.test(part)) {
        const span = doc.createElement("span");
        span.setAttribute("style", MERGE_TAG_STYLE);
        span.textContent = part;
        fragment.appendChild(span);
      } else {
        fragment.appendChild(doc.createTextNode(part));
      }
    }
    textNode.parentNode?.replaceChild(fragment, textNode);
  }

  return `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
}
