export type AxeSeverity = "critical" | "serious" | "moderate" | "minor";

export type AxeCheck = {
  id: string;
  title: string;
  description: string;
  helpUrl: string;
  nodes: number;
};

export type AxeFinding = AxeCheck & {
  impact: AxeSeverity;
};

export type AxeEmailResult = {
  failed: number;
  passed: number;
  ignored: number;
  violations: AxeFinding[];
  violationsBySeverity: Record<AxeSeverity, AxeFinding[]>;
  passes: AxeCheck[];
  incomplete: AxeCheck[];
};

type RawAxeViolation = {
  id: string;
  impact: AxeSeverity | null;
  help: string;
  description: string;
  helpUrl: string;
  nodes: unknown[];
};

type RawAxeResult = {
  violations: RawAxeViolation[];
  passes: RawAxeViolation[];
  incomplete: RawAxeViolation[];
};

type AxeRunOptions = {
  resultTypes: string[];
  rules?: Record<string, { enabled: boolean }>;
};

type FrameAxe = {
  run: (context: Document, options: AxeRunOptions) => Promise<RawAxeResult>;
};

const severities: AxeSeverity[] = ["critical", "serious", "moderate", "minor"];

// Default axe runs WCAG rules written for full web pages. Many of them are
// meaningless or false-positive for email templates: email clients strip
// <title>/<html lang>, there are no landmarks/skip-links/iframes, and
// viewport/meta-refresh rules don't apply. Disabling them keeps the report on
// what actually affects an email's structure and deliverability — alt text,
// color contrast, descriptive link text, data-table semantics, heading order,
// lists, and ARIA correctness (all still enabled).
const EMAIL_IRRELEVANT_RULES = [
  "document-title",
  "html-has-lang",
  "html-lang-valid",
  "html-xml-lang-mismatch",
  "landmark-one-main",
  "landmark-complementary-is-top-level",
  "landmark-main-is-top-level",
  "landmark-banner-is-top-level",
  "landmark-contentinfo-is-top-level",
  "landmark-no-duplicate-banner",
  "landmark-no-duplicate-contentinfo",
  "landmark-no-duplicate-main",
  "landmark-unique",
  "region",
  "page-has-heading-one",
  "bypass",
  "frame-title",
  "frame-title-unique",
  "frame-tested",
  "meta-viewport",
  "meta-viewport-large",
  "meta-refresh",
  "scrollable-region-focusable",
] as const;

const emailRuleOverrides: Record<string, { enabled: boolean }> =
  Object.fromEntries(
    EMAIL_IRRELEVANT_RULES.map((id) => [id, { enabled: false }]),
  );

// Poll the frame until its injected axe has initialized, as a safety net in
// case script execution is not synchronous in some engine.
function waitForFrameAxe(
  iframe: HTMLIFrameElement,
  timeoutMs: number,
): Promise<FrameAxe> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const frameAxe = (iframe.contentWindow as unknown as { axe?: FrameAxe })
        ?.axe;
      if (frameAxe) {
        resolve(frameAxe);
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Could not initialize the accessibility checker."));
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  });
}

export async function runAxe(html: string): Promise<AxeEmailResult> {
  // Run axe inside the iframe's own realm. Handing the frame document to the
  // parent's axe instance throws "axe.run arguments are invalid" because axe
  // checks `context instanceof window.Node` against the top window, which fails
  // across realms. So write the email into a same-origin about:blank frame, load
  // axe there, then call the frame's own axe. Bonus: contrast rules read the
  // email's real styles.
  //
  // We deliberately do NOT `import("axe-core")`: Turbopack bundles it as a CJS
  // module whose `axe.source` references `exports`, which throws "exports is not
  // defined" when executed standalone in the frame. Instead we load the prebuilt
  // UMD bundle served from /vendor/axe.min.js (see scripts/copy-axe.mjs).
  const axeUrl = `${window.location.origin}/vendor/axe.min.js`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:800px;height:900px;border:0;visibility:hidden;";

  document.body.appendChild(iframe);

  try {
    const frameDocument = iframe.contentDocument;
    if (!frameDocument) {
      throw new Error("Could not load email document for accessibility check.");
    }

    // Render the email into the same-origin frame.
    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    // Load the clean UMD axe via a same-origin <script src>. Same-origin (no
    // blob:, no inline) keeps Brave Shields happy and avoids any HTML-parser
    // corruption of the source.
    const script = frameDocument.createElement("script");
    script.src = axeUrl;
    (frameDocument.head ?? frameDocument.documentElement).appendChild(script);

    const frameAxe = await waitForFrameAxe(iframe, 8000);

    const result = await frameAxe.run(frameDocument, {
      resultTypes: ["violations", "passes", "incomplete"],
      rules: emailRuleOverrides,
    });

    const toCheck = (raw: RawAxeViolation): AxeCheck => ({
      id: raw.id,
      title: raw.help,
      description: raw.description,
      helpUrl: raw.helpUrl,
      nodes: raw.nodes.length,
    });

    const violations: AxeFinding[] = result.violations.map((violation) => ({
      ...toCheck(violation),
      impact: violation.impact ?? "minor",
    }));
    const passes = result.passes.map(toCheck);
    const incomplete = result.incomplete.map(toCheck);

    return {
      failed: violations.length,
      passed: passes.length,
      ignored: incomplete.length,
      violations,
      violationsBySeverity: Object.fromEntries(
        severities.map((severity) => [
          severity,
          violations.filter((finding) => finding.impact === severity),
        ]),
      ) as Record<AxeSeverity, AxeFinding[]>,
      passes,
      incomplete,
    };
  } finally {
    iframe.remove();
  }
}
