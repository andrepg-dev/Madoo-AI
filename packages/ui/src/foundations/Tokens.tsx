const RADII = [
  { name: "xs", token: "--radius-xs" },
  { name: "sm", token: "--radius-sm" },
  { name: "md", token: "--radius-md" },
  { name: "lg", token: "--radius-lg" },
  { name: "xl", token: "--radius-xl" },
  { name: "2xl", token: "--radius-2xl" },
  { name: "pill", token: "--radius-pill" },
];

const SHADOWS = [
  { name: "xs", token: "--shadow-xs" },
  { name: "sm", token: "--shadow-sm" },
  { name: "md", token: "--shadow-md" },
  { name: "lg", token: "--shadow-lg" },
  { name: "xl", token: "--shadow-xl" },
];

const SPACING = [
  { name: "1", token: "--space-1" },
  { name: "2", token: "--space-2" },
  { name: "3", token: "--space-3" },
  { name: "4", token: "--space-4" },
  { name: "5", token: "--space-5" },
  { name: "6", token: "--space-6" },
  { name: "8", token: "--space-8" },
  { name: "10", token: "--space-10" },
  { name: "12", token: "--space-12" },
];

export function TokensReference() {
  return (
    <div style={{ fontFamily: "var(--font-sans)", color: "var(--ink)", display: "grid", gap: 36 }}>
      <section>
        <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 24, margin: 0 }}>
          Radii
        </h3>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
          {RADII.map((r) => (
            <div key={r.token} style={{ width: 110, textAlign: "center" }}>
              <div
                style={{
                  width: "100%",
                  height: 64,
                  background: "var(--accent-soft)",
                  border: "1px solid var(--border)",
                  borderRadius: `var(${r.token})`,
                }}
              />
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{r.name}</div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-soft)" }}>
                var({r.token})
              </code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 24, margin: 0 }}>
          Shadows
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
            marginTop: 12,
          }}
        >
          {SHADOWS.map((s) => (
            <div
              key={s.token}
              style={{
                background: "var(--surface)",
                borderRadius: 12,
                padding: 16,
                border: "1px solid var(--border-soft)",
                boxShadow: `var(${s.token})`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
              <code style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-soft)" }}>
                var({s.token})
              </code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 24, margin: 0 }}>
          Spacing
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
          {SPACING.map((s) => (
            <div key={s.token} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 40, fontSize: 12, fontWeight: 600 }}>{s.name}</div>
              <div
                style={{
                  height: 10,
                  width: `var(${s.token})`,
                  background: "var(--accent)",
                  borderRadius: 999,
                }}
              />
              <code
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--ink-soft)",
                }}
              >
                var({s.token})
              </code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
