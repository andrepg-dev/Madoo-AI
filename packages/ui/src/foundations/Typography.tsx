const SCALE = [
  { name: "display", size: 52, family: "serif", weight: 400, italic: true },
  { name: "h1", size: 32, family: "serif", weight: 400 },
  { name: "h2", size: 22, family: "sans", weight: 600 },
  { name: "body-lg", size: 16, family: "sans", weight: 400 },
  { name: "body", size: 14, family: "sans", weight: 400 },
  { name: "body-sm", size: 13.5, family: "sans", weight: 500 },
  { name: "caption", size: 12.5, family: "sans", weight: 500 },
  { name: "label", size: 11, family: "sans", weight: 600 },
  { name: "mono", size: 12, family: "mono", weight: 500 },
] as const;

export function TypographyScale() {
  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--ink)" }}>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 400,
          fontSize: 36,
          margin: "0 0 8px",
        }}
      >
        Typography
      </h2>
      <p style={{ color: "var(--ink-soft)", maxWidth: 540, lineHeight: 1.55 }}>
        El sistema combina Instrument Serif (titulares editoriales),
        Inter (UI) y JetBrains Mono (tokens y datos tecnicos).
      </p>
      <div
        style={{
          marginTop: 24,
          display: "grid",
          gap: 16,
        }}
      >
        {SCALE.map((row) => (
          <div
            key={row.name}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 80px 1fr",
              gap: 16,
              alignItems: "center",
              borderBottom: "1px solid var(--border-soft)",
              paddingBottom: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                {row.family} · {row.weight}
              </div>
            </div>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)" }}>
              {row.size}px
            </code>
            <div
              style={{
                fontFamily:
                  row.family === "serif"
                    ? "var(--font-serif)"
                    : row.family === "mono"
                      ? "var(--font-mono)"
                      : "var(--font-sans)",
                fontSize: row.size,
                fontWeight: row.weight,
                fontStyle:
                  "italic" in row && (row as { italic?: boolean }).italic
                    ? "italic"
                    : undefined,
                lineHeight: 1.1,
                color: "var(--ink)",
              }}
            >
              What email do you want to send today?
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
