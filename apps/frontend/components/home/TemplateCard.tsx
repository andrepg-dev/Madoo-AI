"use client";

import { useState } from "react";
import { Icon } from "@madoo/ui";
import { TemplatePreview } from "@/components/templates/TemplatePreview";
import type { Template } from "@/lib/data";

export function TemplateCard({ template, onClick }: { template: Template; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const isPremium = template.tier === "premium";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 10,
        cursor: "pointer",
        transition: "all 0.18s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? "0 16px 32px -12px rgba(50,40,30,0.18)" : "0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      <div
        style={{
          aspectRatio: "4 / 5",
          borderRadius: 9,
          overflow: "hidden",
          position: "relative",
          background: template.bg,
          border: "1px solid var(--border-soft)",
        }}
      >
        <TemplatePreview template={template} scale={1.4} />
        {isPremium && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              background: "rgba(20,15,10,0.85)",
              backdropFilter: "blur(6px)",
              color: "#F8E5C0",
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: 0.3,
            }}
          >
            <Icon name="lock" size={10} /> PRO
          </div>
        )}
        {hovered && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, transparent 50%, rgba(20,15,10,0.5))",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                padding: "8px 14px",
                background: "var(--bg)",
                color: "var(--ink)",
                fontSize: 12.5,
                fontWeight: 600,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isPremium ? (
                <>
                  <Icon name="lock" size={11} /> Unlock template
                </>
              ) : (
                <>
                  Use this template <Icon name="arrow" size={11} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          padding: "10px 6px 4px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", letterSpacing: -0.1 }}>
            {template.name}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>{template.category}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isPremium && (
            <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--ink-faint)" }}>
              <Icon name="bolt" size={11} /> 1 credit
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--ink-faint)" }}>
            <Icon name="star" size={11} /> {(4.6 + (template.id.charCodeAt(0) % 4) * 0.05).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
