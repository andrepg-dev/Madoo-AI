/**
 * Paleta visualizada como swatches. Se usa desde Color.stories.tsx.
 */

const COLOR_GROUPS: { title: string; colors: { name: string; token: string }[] }[] = [
  {
    title: "Surfaces",
    colors: [
      { name: "bg", token: "--bg" },
      { name: "bg-2", token: "--bg-2" },
      { name: "surface", token: "--surface" },
      { name: "surface-2", token: "--surface-2" },
      { name: "surface-blue", token: "--surface-blue" },
    ],
  },
  {
    title: "Ink",
    colors: [
      { name: "ink", token: "--ink" },
      { name: "ink-soft", token: "--ink-soft" },
      { name: "ink-muted", token: "--ink-muted" },
      { name: "ink-faint", token: "--ink-faint" },
      { name: "border", token: "--border" },
      { name: "border-soft", token: "--border-soft" },
    ],
  },
  {
    title: "Accent",
    colors: [
      { name: "accent", token: "--accent" },
      { name: "accent-deep", token: "--accent-deep" },
      { name: "accent-soft", token: "--accent-soft" },
      { name: "accent-fg", token: "--accent-fg" },
      { name: "link", token: "--link" },
      { name: "rule", token: "--rule" },
    ],
  },
  {
    title: "Landing aliases",
    colors: [
      { name: "madoo-text", token: "--madoo-text" },
      { name: "madoo-copy", token: "--madoo-copy" },
      { name: "madoo-muted", token: "--madoo-muted" },
      { name: "madoo-page", token: "--madoo-page" },
      { name: "madoo-paper", token: "--madoo-paper" },
      { name: "madoo-surface", token: "--madoo-surface" },
      { name: "madoo-link", token: "--madoo-link" },
    ],
  },
  {
    title: "Status",
    colors: [
      { name: "success", token: "--success" },
      { name: "success-soft", token: "--success-soft" },
      { name: "warn", token: "--warn" },
      { name: "warn-soft", token: "--warn-soft" },
      { name: "danger", token: "--danger" },
      { name: "danger-soft", token: "--danger-soft" },
      { name: "info", token: "--info" },
      { name: "info-soft", token: "--info-soft" },
    ],
  },
];

export function ColorPalette() {
  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--ink)" }}>
      {COLOR_GROUPS.map((group) => (
        <section key={group.title} style={{ marginBottom: 32 }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 24,
              margin: 0,
            }}
          >
            {group.title}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
              marginTop: 12,
            }}
          >
            {group.colors.map((c) => (
              <div
                key={c.token}
                style={{
                  borderRadius: 12,
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-border)",
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    height: 56,
                    borderRadius: 8,
                    background: `var(${c.token})`,
                    boxShadow: "var(--shadow-border-soft)",
                  }}
                />
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{c.name}</div>
                <code
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--ink-soft)",
                  }}
                >
                  var({c.token})
                </code>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
