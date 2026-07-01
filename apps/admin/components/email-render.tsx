"use client";

import type { AdminEmailVariant } from "@madoo/shared";
import { useState } from "react";

export function EmailRender({ variants }: { variants: AdminEmailVariant[] }) {
  const [active, setActive] = useState(Math.max(0, variants.length - 1));

  if (variants.length === 0) {
    return (
      <div className="chart-card">
        <p className="empty">No rendered variant for this email yet.</p>
      </div>
    );
  }

  const variant = variants[active] ?? variants[variants.length - 1];

  return (
    <div>
      {variants.length > 1 ? (
        <div className="variant-tabs">
          {variants.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`btn ${index === active ? "btn-primary" : ""}`}
              onClick={() => setActive(index)}
            >
              Variant {index + 1}
            </button>
          ))}
        </div>
      ) : null}
      <p className="subject-line">
        Subject: <strong>{variant.subject || "—"}</strong>
      </p>
      <iframe
        className="render-frame"
        title="Email preview"
        sandbox=""
        srcDoc={variant.compiledHtml}
      />
    </div>
  );
}
