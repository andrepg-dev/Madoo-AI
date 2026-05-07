import type { Template } from "@/lib/data";

export function TemplatePreview({ template, scale = 1 }: { template: Template; scale?: number }) {
  const { preview, accent, bg, name } = template;
  const wrap: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: bg,
    padding: 16 * scale,
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: 8 * scale,
    color: accent,
    overflow: "hidden",
    position: "relative",
  };
  const serif: React.CSSProperties = { fontFamily: "var(--font-instrument-serif), Georgia, serif" };

  if (preview === "launch") {
    return (
      <div style={{ ...wrap, padding: 0, gap: 0 }}>
        {/* Dark header bar */}
        <div style={{ background: accent, padding: `${10 * scale}px ${14 * scale}px` }}>
          <div style={{ fontSize: 7 * scale, fontWeight: 700, color: bg, opacity: 0.9 }}>BRAND</div>
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", padding: 14 * scale, display: "flex", flexDirection: "column", gap: 8 * scale }}>
          <div style={{ fontSize: 7 * scale, letterSpacing: "0.1em", textTransform: "uppercase" as const, opacity: 0.45, fontWeight: 600 }}>
            PRODUCT LAUNCH
          </div>
          <div style={{ fontSize: 18 * scale, ...serif, lineHeight: 1.05, fontWeight: 500, letterSpacing: -0.4 }}>
            Something new
            <br />
            is shipping.
          </div>
          <div style={{ fontSize: 7 * scale, opacity: 0.7, lineHeight: 1.5 }}>
            We rebuilt the engine from scratch. Faster, calmer, more yours.
          </div>
          <div
            style={{
              display: "inline-block",
              padding: `${5 * scale}px ${10 * scale}px`,
              background: accent,
              color: bg,
              fontSize: 7 * scale,
              borderRadius: 6 * scale,
              alignSelf: "flex-start",
              fontWeight: 600,
            }}
          >
            Explore the release →
          </div>
          <div style={{ borderTop: `1px solid ${accent}15`, paddingTop: 8 * scale, display: "flex", gap: 6 * scale }}>
            {["2× faster", "Redesigned", "AI built in"].map((f) => (
              <div key={f} style={{ fontSize: 5.5 * scale, opacity: 0.6, fontWeight: 500 }}>✓ {f}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (preview === "editorial") {
    return (
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 6 * scale, letterSpacing: "0.08em", textTransform: "uppercase" as const, opacity: 0.5, fontFamily: "system-ui, sans-serif" }}>
          <span>The Editorial · Vol. 12</span>
          <span>May 2026</span>
        </div>
        <div style={{ borderBottom: `1.5px solid ${accent}20`, marginBottom: 2 * scale }} />
        <div style={{ fontSize: 24 * scale, ...serif, lineHeight: 1.05, fontStyle: "italic", marginTop: 4 * scale, letterSpacing: -0.3 }}>
          Slow letters,
          <br />
          fast ideas.
        </div>
        <div style={{ fontSize: 7 * scale, lineHeight: 1.6, opacity: 0.75, marginTop: 2 * scale }}>
          This week: attention, deep work, and why the inbox is having a moment.
        </div>
        <div style={{ borderTop: `1px solid ${accent}15`, paddingTop: 8 * scale, marginTop: 4 * scale, display: "flex", flexDirection: "column", gap: 6 * scale }}>
          {["The case for writing one thing a day", "Why you should reply slower", "May reading list"].map((t) => (
            <div key={t} style={{ fontSize: 6.5 * scale, fontWeight: 600, opacity: 0.85, lineHeight: 1.3 }}>{t}</div>
          ))}
        </div>
        <div style={{ fontSize: 5.5 * scale, opacity: 0.4, marginTop: "auto", fontStyle: "italic", ...serif }}>— Continue reading</div>
      </div>
    );
  }

  if (preview === "sale") {
    return (
      <div style={{ ...wrap, padding: 0, gap: 0 }}>
        <div style={{ background: accent, padding: `${8 * scale}px ${14 * scale}px` }}>
          <div style={{ fontSize: 7 * scale, fontWeight: 800, letterSpacing: "0.15em", color: bg }}>LIMITED · 48 HOURS</div>
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", padding: 14 * scale, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 52 * scale,
              fontWeight: 900,
              lineHeight: 0.88,
              color: accent,
              letterSpacing: -2,
              marginTop: 4 * scale,
            }}
          >
            40%
            <br />
            OFF.
          </div>
          <div style={{ fontSize: 8 * scale, marginTop: 6 * scale, fontWeight: 600, opacity: 0.85 }}>Everything. No exclusions.</div>
          <div style={{ fontSize: 7 * scale, opacity: 0.55, marginTop: 3 * scale }}>Ends Sunday at midnight.</div>
          <div
            style={{
              marginTop: "auto",
              padding: `${7 * scale}px ${12 * scale}px`,
              background: accent,
              color: bg,
              fontSize: 8 * scale,
              fontWeight: 700,
              alignSelf: "flex-start",
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            Shop the drop →
          </div>
        </div>
      </div>
    );
  }

  if (preview === "minimal") {
    return (
      <div style={{ ...wrap, padding: 18 * scale, gap: 0 }}>
        <div style={{ width: 14 * scale, height: 14 * scale, background: accent, borderRadius: 3 * scale, marginBottom: 12 * scale }} />
        <div style={{ fontSize: 6.5 * scale, letterSpacing: "0.08em", opacity: 0.5, fontWeight: 600, textTransform: "uppercase" as const, marginBottom: 6 * scale }}>
          Changelog · v2.4
        </div>
        <div style={{ fontSize: 11 * scale, fontWeight: 700, lineHeight: 1.1, marginBottom: 16 * scale, letterSpacing: -0.3 }}>
          Product updates
          <br />
          you should know.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 * scale }}>
          {[
            "✓ New: Realtime collaboration",
            "✓ Improved: Search 3× faster",
            "✓ Fixed: Editor cursor jump",
            "✓ New: Dark mode",
          ].map((t) => (
            <div key={t} style={{ fontSize: 7 * scale, opacity: 0.8, lineHeight: 1.4 }}>{t}</div>
          ))}
        </div>
        <div style={{ marginTop: "auto", fontSize: 6 * scale, opacity: 0.4, borderTop: `1px solid ${accent}20`, paddingTop: 8 * scale }}>
          See full release notes →
        </div>
      </div>
    );
  }

  if (preview === "welcome") {
    return (
      <div style={{ ...wrap, padding: 0, gap: 0 }}>
        <div style={{ background: accent, padding: `${14 * scale}px ${14 * scale}px ${12 * scale}px` }}>
          <div
            style={{
              width: 22 * scale,
              height: 22 * scale,
              background: bg,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: accent,
              fontSize: 10 * scale,
              fontWeight: 700,
            }}
          >
            M
          </div>
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", padding: 14 * scale, display: "flex", flexDirection: "column", gap: 8 * scale }}>
          <div style={{ fontSize: 17 * scale, ...serif, lineHeight: 1.1 }}>
            Hi there,
            <br />
            welcome in.
          </div>
          <div style={{ fontSize: 7 * scale, lineHeight: 1.5, opacity: 0.75 }}>
            Three quick things to get you started:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 * scale }}>
            {["Set up your profile", "Invite your team", "Send your first email"].map((t, i) => (
              <div key={t} style={{ fontSize: 7 * scale, display: "flex", gap: 6 * scale, alignItems: "center" }}>
                <div
                  style={{
                    width: 14 * scale,
                    height: 14 * scale,
                    border: `1.5px solid ${accent}`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 6 * scale,
                    fontWeight: 700,
                    flexShrink: 0,
                    color: accent,
                  }}
                >
                  {i + 1}
                </div>
                <span style={{ opacity: 0.85 }}>{t}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "auto",
              padding: `${5 * scale}px ${10 * scale}px`,
              background: accent,
              color: bg,
              fontSize: 7 * scale,
              borderRadius: 6 * scale,
              alignSelf: "flex-start",
              fontWeight: 600,
            }}
          >
            Complete setup →
          </div>
        </div>
      </div>
    );
  }

  if (preview === "event") {
    return (
      <div style={{ ...wrap, padding: 0, gap: 0 }}>
        <div style={{ background: accent, padding: `${18 * scale}px ${14 * scale}px` }}>
          <div style={{ fontSize: 6.5 * scale, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: bg, opacity: 0.7, marginBottom: 6 * scale }}>You&apos;re invited</div>
          <div style={{ fontSize: 20 * scale, ...serif, lineHeight: 1.05, color: bg }}>
            An evening
            <br />
            of ideas.
          </div>
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", padding: 14 * scale, display: "flex", flexDirection: "column", gap: 8 * scale }}>
          <div
            style={{
              padding: 8 * scale,
              border: `1px solid ${accent}25`,
              borderRadius: 5 * scale,
              fontSize: 7 * scale,
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700 }}>May 14 · 7:00 PM</div>
            <div style={{ opacity: 0.65 }}>The Foundry, Brooklyn NY</div>
          </div>
          <div style={{ display: "flex", gap: 5 * scale, marginTop: "auto" }}>
            <div
              style={{
                padding: `${5 * scale}px ${10 * scale}px`,
                background: accent,
                color: bg,
                fontSize: 7 * scale,
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              RSVP yes
            </div>
            <div
              style={{
                padding: `${5 * scale}px ${10 * scale}px`,
                border: `1px solid ${accent}35`,
                fontSize: 7 * scale,
                borderRadius: 999,
                opacity: 0.7,
              }}
            >
              Maybe
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (preview === "digest") {
    const items = [
      "The case for slower email",
      "Why notifications are broken",
      "A new way to read",
      "The future of async work",
    ];
    return (
      <div style={wrap}>
        <div style={{ fontSize: 7.5 * scale, ...serif, fontStyle: "italic", opacity: 0.65 }}>The Weekly</div>
        <div style={{ fontSize: 16 * scale, fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.3 }}>
          5 things worth
          <br />
          your attention.
        </div>
        <div style={{ borderTop: `1px solid ${accent}15`, marginTop: 4 * scale, paddingTop: 8 * scale, display: "flex", flexDirection: "column", gap: 6 * scale }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 6 * scale, fontSize: 6.5 * scale, lineHeight: 1.4 }}>
              <span style={{ fontWeight: 800, opacity: 0.35, minWidth: 14 * scale }}>0{i + 1}</span>
              <span style={{ opacity: 0.85 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (preview === "thanks") {
    return (
      <div style={{ ...wrap, padding: 0, gap: 0 }}>
        <div style={{ background: accent, padding: `${12 * scale}px ${14 * scale}px` }}>
          <div style={{ fontSize: 8 * scale, fontWeight: 700, color: bg, opacity: 0.85 }}>ORDER CONFIRMED</div>
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", padding: 14 * scale, display: "flex", flexDirection: "column", gap: 8 * scale }}>
          <div style={{ fontSize: 30 * scale, ...serif, lineHeight: 1, fontStyle: "italic" }}>
            Thank
            <br />
            you.
          </div>
          <div style={{ fontSize: 7 * scale, opacity: 0.7, lineHeight: 1.5 }}>
            Your order #2841 is on its way.
          </div>
          <div
            style={{
              background: `${accent}08`,
              border: `1px solid ${accent}15`,
              borderRadius: 4 * scale,
              padding: 7 * scale,
              fontSize: 6.5 * scale,
              lineHeight: 1.8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.6 }}>Order</span>
              <span style={{ fontWeight: 600 }}>#2841</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.6 }}>Ships in</span>
              <span style={{ fontWeight: 600 }}>2–3 days</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ opacity: 0.6 }}>Total</span>
              <span style={{ fontWeight: 600 }}>$89.00</span>
            </div>
          </div>
          <div style={{ marginTop: "auto", fontSize: 6 * scale, opacity: 0.45, fontStyle: "italic", ...serif }}>— The team</div>
        </div>
      </div>
    );
  }

  if (preview === "feature") {
    return (
      <div style={{ ...wrap, padding: 0, gap: 0 }}>
        <div style={{ background: accent, padding: `${12 * scale}px ${14 * scale}px` }}>
          <div style={{ fontSize: 6.5 * scale, fontWeight: 700, letterSpacing: "0.1em", color: bg }}>★ NEW FEATURE</div>
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", padding: 14 * scale, display: "flex", flexDirection: "column", gap: 6 * scale }}>
          <div style={{ fontSize: 14 * scale, fontWeight: 700, lineHeight: 1.15, letterSpacing: -0.3 }}>Meet smart blocks.</div>
          {/* UI mockup area */}
          <div
            style={{
              flex: 1,
              background: `${accent}0D`,
              borderRadius: 4 * scale,
              padding: 6 * scale,
              overflow: "hidden",
            }}
          >
            {/* Mockup title bar */}
            <div style={{ background: accent, height: 10 * scale, borderRadius: 2 * scale, marginBottom: 5 * scale, opacity: 0.9 }} />
            {/* Mockup rows */}
            {[80, 60, 70].map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 4 * scale, marginBottom: 4 * scale, alignItems: "center" }}>
                <div style={{ width: 8 * scale, height: 8 * scale, borderRadius: "50%", background: `${accent}50`, flexShrink: 0 }} />
                <div style={{ width: `${w}%`, height: 4 * scale, background: `${accent}25`, borderRadius: 1 }} />
              </div>
            ))}
            {/* Action button inside mockup */}
            <div style={{ marginTop: 4 * scale, background: accent, height: 10 * scale, borderRadius: 2 * scale, opacity: 0.7, width: "60%" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 * scale }}>
            {["Drag, drop, done.", "Works with any layout.", "AI-powered suggestions."].map((b) => (
              <div key={b} style={{ fontSize: 6 * scale, opacity: 0.7 }}>✓ {b}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (preview === "survey") {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 14 * scale, fontWeight: 700, lineHeight: 1.2, letterSpacing: -0.3 }}>How did we do?</div>
        <div style={{ fontSize: 7 * scale, opacity: 0.6, marginTop: -2 * scale }}>One quick question.</div>
        <div style={{ display: "flex", gap: 3 * scale, marginTop: 8 * scale }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                aspectRatio: "1",
                border: `1.5px solid ${i === 4 ? accent : `${accent}25`}`,
                borderRadius: 4 * scale,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9 * scale,
                fontWeight: 700,
                background: i === 4 ? accent : "transparent",
                color: i === 4 ? bg : accent,
              }}
            >
              {i}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 5.5 * scale, opacity: 0.45, marginTop: 2 * scale }}>
          <span>Awful</span>
          <span>Great</span>
        </div>
        <div style={{ marginTop: 8 * scale, padding: 7 * scale, border: `1px solid ${accent}15`, borderRadius: 4 * scale, fontSize: 6.5 * scale, opacity: 0.6, lineHeight: 1.5 }}>
          What can we do better? (optional)
        </div>
      </div>
    );
  }

  if (preview === "reengage") {
    return (
      <div style={{ ...wrap, padding: 0, gap: 0 }}>
        <div style={{ background: accent, padding: `${18 * scale}px ${14 * scale}px` }}>
          <div style={{ fontSize: 20 * scale, ...serif, lineHeight: 1.05, fontStyle: "italic", color: bg }}>
            We&apos;ve missed
            <br />
            you.
          </div>
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", padding: 14 * scale, display: "flex", flexDirection: "column", gap: 6 * scale }}>
          <div style={{ fontSize: 7 * scale, opacity: 0.7, lineHeight: 1.5 }}>
            Here&apos;s what&apos;s new since your last visit:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 * scale, fontSize: 7 * scale }}>
            <span>· 12 new templates</span>
            <span>· AI is 2× faster</span>
            <span>· Custom brand kits</span>
            <span>· Dark mode</span>
          </div>
          <div
            style={{
              background: `${accent}10`,
              border: `1px solid ${accent}20`,
              borderRadius: 5 * scale,
              padding: 7 * scale,
              fontSize: 7.5 * scale,
              fontWeight: 700,
              textAlign: "center" as const,
            }}
          >
            20% off — use code COMEBACK
          </div>
          <div
            style={{
              marginTop: "auto",
              padding: `${5 * scale}px ${10 * scale}px`,
              background: accent,
              color: bg,
              fontSize: 7 * scale,
              borderRadius: 4 * scale,
              alignSelf: "flex-start",
              fontWeight: 600,
            }}
          >
            Come back →
          </div>
        </div>
      </div>
    );
  }

  if (preview === "referral") {
    return (
      <div style={{ ...wrap, padding: 0, gap: 0 }}>
        <div style={{ background: accent, padding: `${16 * scale}px ${14 * scale}px` }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 8 * scale }}>
            {[1, 0.55, 0.28].map((op, i) => (
              <div
                key={i}
                style={{
                  width: 18 * scale,
                  height: 18 * scale,
                  borderRadius: "50%",
                  background: bg,
                  opacity: op,
                  marginLeft: i > 0 ? -7 * scale : 0,
                  border: `1.5px solid ${accent}`,
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 16 * scale, fontWeight: 700, color: bg, lineHeight: 1.1, letterSpacing: -0.3 }}>
            Bring a friend,
            <br />
            get $20.
          </div>
        </div>
        <div style={{ flex: 1, background: "#FFFFFF", padding: 14 * scale, display: "flex", flexDirection: "column", gap: 7 * scale }}>
          <div style={{ fontSize: 7 * scale, opacity: 0.65, lineHeight: 1.5 }}>
            Both of you get $20 when they sign up.
          </div>
          <div
            style={{
              padding: 8 * scale,
              background: `${accent}08`,
              border: `1.5px dashed ${accent}35`,
              borderRadius: 4 * scale,
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: 8 * scale,
              fontWeight: 700,
              textAlign: "center" as const,
              letterSpacing: "0.08em",
            }}
          >
            SHARE-{name.slice(0, 4).toUpperCase()}
          </div>
          <div style={{ fontSize: 6 * scale, opacity: 0.45, textAlign: "center" as const }}>Tap to copy your code</div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ fontSize: 10 * scale }}>{name}</div>
    </div>
  );
}
