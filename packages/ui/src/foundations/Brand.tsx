const PRINCIPLES = [
  {
    title: "White first",
    body: "Primary surfaces are white, framed by cold gray pattern fields and thin blue ink rules.",
  },
  {
    title: "AI product, not generic SaaS",
    body: "Use precise controls, editor-like surfaces, provider logos, previews, and real template content.",
  },
  {
    title: "Sharp hierarchy",
    body: "Large Figtree headlines, compact IBM Plex Sans UI, and quiet muted copy keep screens focused.",
  },
  {
    title: "Blue as structure",
    body: "Deep navy carries brand weight. Bright blue-violet is reserved for links, focus, and small active states.",
  },
];

const DO_DONT = [
  { label: "Do", text: "Use white panels, 0.5px rules, 28px marketing panels, and 8px controls." },
  { label: "Do", text: "Keep app screens dense, scannable, and built around repeated email workflows." },
  { label: "Do not", text: "Return to beige, green accents, heavy cards, or decorative gradient blobs." },
  { label: "Do not", text: "Use hero-scale type inside compact panels, toolbars, tables, or cards." },
];

export function BrandSystem() {
  return (
    <div
      style={{
        display: "grid",
        gap: 28,
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <section
        className="madoo-pattern-background"
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "var(--radius-shell)",
          minHeight: 320,
          padding: 12,
          boxShadow: "inset 0 0 0 0.5px rgb(var(--ink-shadow-rgb) / 0.14)",
        }}
      >
        <div
          style={{
            display: "grid",
            alignContent: "center",
            minHeight: 296,
            borderRadius: "calc(var(--radius-shell) - 4px)",
            background: "var(--surface)",
            boxShadow: "var(--shadow-inner-rule)",
            padding: 40,
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "var(--ink-muted)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Madoo AI design system
          </p>
          <h2
            style={{
              margin: 0,
              maxWidth: 680,
              fontFamily: "var(--font-display)",
              fontSize: "var(--font-size-display)",
              fontWeight: 600,
              letterSpacing: 0,
              lineHeight: "var(--line-height-tight)",
            }}
          >
            Professional email design, built around AI workflow speed.
          </h2>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {PRINCIPLES.map((item) => (
          <article
            key={item.title}
            style={{
              borderRadius: "var(--radius-md)",
              background: "var(--surface)",
              boxShadow: "var(--shadow-inner-rule)",
              padding: 18,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{item.title}</h3>
            <p
              style={{
                margin: "8px 0 0",
                color: "var(--ink-muted)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {item.body}
            </p>
          </article>
        ))}
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {DO_DONT.map((item) => (
          <div
            key={item.text}
            style={{
              display: "grid",
              gridTemplateColumns: "72px 1fr",
              gap: 12,
              alignItems: "start",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-border-soft)",
              background: "var(--surface)",
              padding: 14,
            }}
          >
            <span
              style={{
                borderRadius: "var(--radius-pill)",
                background:
                  item.label === "Do" ? "var(--accent-soft)" : "var(--danger-soft)",
                color: item.label === "Do" ? "var(--accent)" : "var(--danger)",
                fontSize: 12,
                fontWeight: 600,
                textAlign: "center",
                padding: "4px 8px",
              }}
            >
              {item.label}
            </span>
            <p style={{ margin: 0, color: "var(--ink-muted)", fontSize: 13, lineHeight: 1.5 }}>
              {item.text}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
