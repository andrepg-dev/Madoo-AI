"use client";

import type { AdminEmailVariant } from "@madoo/shared";
import { useState } from "react";

export function EmailRender({ variants }: { variants: AdminEmailVariant[] }) {
  const [active, setActive] = useState(Math.max(0, variants.length - 1));
  const [mode, setMode] = useState<"image" | "html">("image");

  if (variants.length === 0) {
    return (
      <div className="chart-card">
        <p className="empty">No rendered variant for this email yet.</p>
      </div>
    );
  }

  const variant = variants[active] ?? variants[variants.length - 1];
  const showImage = mode === "image" && Boolean(variant.previewUrl);

  return (
    <div>
      <div className="variant-tabs">
        {variants.length > 1
          ? variants.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`btn ${index === active ? "btn-primary" : ""}`}
                onClick={() => setActive(index)}
              >
                Variant {index + 1}
              </button>
            ))
          : null}
        {variant.previewUrl ? (
          <div className="render-toggle">
            <button
              type="button"
              className={`btn ${mode === "image" ? "btn-primary" : ""}`}
              onClick={() => setMode("image")}
            >
              Image
            </button>
            <button
              type="button"
              className={`btn ${mode === "html" ? "btn-primary" : ""}`}
              onClick={() => setMode("html")}
            >
              HTML
            </button>
          </div>
        ) : null}
      </div>
      <p className="subject-line">
        Subject: <strong>{variant.subject || "—"}</strong>
      </p>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="render-image"
          src={variant.previewUrl ?? ""}
          alt={`Rendered preview of ${variant.subject || "email"}`}
        />
      ) : (
        <iframe
          className="render-frame"
          title="Email preview"
          sandbox=""
          srcDoc={variant.compiledHtml}
        />
      )}
    </div>
  );
}
