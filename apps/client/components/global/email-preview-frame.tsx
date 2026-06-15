"use client";

import { cx } from "@madoo/design-system";
import { useMemo } from "react";
import { highlightMergeTags } from "@/lib/highlight-merge-tags";

type EmailPreviewFrameProps = {
  /** Compiled email HTML to render. */
  html: string | null;
  title?: string;
  className?: string;
};

/**
 * Sandboxed iframe that renders compiled email HTML with `{{merge tags}}`
 * highlighted. Use this anywhere an email preview is shown so the highlight
 * behavior is identical across the app instead of being re-implemented.
 */
export default function EmailPreviewFrame({
  html,
  title = "Email preview",
  className,
}: EmailPreviewFrameProps) {
  const srcDoc = useMemo(() => highlightMergeTags(html) ?? "", [html]);

  return (
    <iframe
      className={cx("w-full border-0 bg-white", className)}
      sandbox=""
      srcDoc={srcDoc}
      title={title}
    />
  );
}
