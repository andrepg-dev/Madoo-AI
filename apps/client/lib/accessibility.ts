export type AxeSeverity = "critical" | "serious" | "moderate" | "minor";

export type AxeFinding = {
  id: string;
  impact: AxeSeverity;
  title: string;
  description: string;
  helpUrl: string;
  nodes: number;
};

export type AxeEmailResult = {
  failed: number;
  passed: number;
  ignored: number;
  violations: AxeFinding[];
  violationsBySeverity: Record<AxeSeverity, AxeFinding[]>;
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
  passes: unknown[];
};

const severities: AxeSeverity[] = ["critical", "serious", "moderate", "minor"];

export async function runAxe(html: string): Promise<AxeEmailResult> {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;width:800px;height:900px;border:0;visibility:hidden;";

  const loaded = new Promise<void>((resolve) => {
    iframe.addEventListener("load", () => resolve(), { once: true });
    window.setTimeout(resolve, 1200);
  });

  document.body.appendChild(iframe);
  iframe.srcdoc = html;
  await loaded;

  try {
    const frameDocument = iframe.contentDocument;
    if (!frameDocument) {
      throw new Error("Could not load email document for accessibility check.");
    }

    const axe = (await import("axe-core")).default;
    const result = (await axe.run(frameDocument, {
      resultTypes: ["violations", "passes", "incomplete"],
    })) as RawAxeResult;

    const violations = result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact ?? "minor",
      title: violation.help,
      description: violation.description,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.length,
    }));

    return {
      failed: violations.length,
      passed: result.passes.length,
      ignored: 0,
      violations,
      violationsBySeverity: Object.fromEntries(
        severities.map((severity) => [
          severity,
          violations.filter((finding) => finding.impact === severity),
        ]),
      ) as Record<AxeSeverity, AxeFinding[]>,
    };
  } finally {
    iframe.remove();
  }
}
