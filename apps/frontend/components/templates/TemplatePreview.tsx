import type { Template } from "@/lib/data";

export function TemplatePreview({ template, scale = 1 }: { template: Template; scale?: number }) {
  const { preview, accent, bg, name } = template;
  const wrap: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: bg,
    padding: 16 * scale,
    fontFamily: "var(--font-inter), sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: 8 * scale,
    color: accent,
    overflow: "hidden",
    position: "relative",
  };
  const serif: React.CSSProperties = { fontFamily: "var(--font-instrument-serif), serif" };

  if (preview === "launch") {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 8 * scale, opacity: 0.5, fontWeight: 500 }}>MAILMINT · ISSUE 04</div>
        <div style={{ fontSize: 22 * scale, ...serif, lineHeight: 1.05, marginTop: 6 * scale, fontWeight: 400 }}>
          Something new
          <br />
          is shipping.
        </div>
        <div
          style={{
            flex: 1,
            background: accent,
            borderRadius: 4 * scale,
            marginTop: 8 * scale,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `repeating-linear-gradient(45deg, transparent, transparent ${4 * scale}px, rgba(255,255,255,0.04) ${4 * scale}px, rgba(255,255,255,0.04) ${8 * scale}px)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 8 * scale,
              left: 8 * scale,
              color: bg,
              fontSize: 7 * scale,
              opacity: 0.6,
            }}
          >
            v2.0 →
          </div>
        </div>
        <div style={{ fontSize: 7 * scale, opacity: 0.7, lineHeight: 1.4 }}>
          We rebuilt the engine from scratch. Faster, calmer, more yours.
        </div>
        <div
          style={{
            display: "inline-block",
            padding: `${4 * scale}px ${8 * scale}px`,
            background: accent,
            color: bg,
            fontSize: 7 * scale,
            borderRadius: 999,
            alignSelf: "flex-start",
            fontWeight: 500,
          }}
        >
          Read the post →
        </div>
      </div>
    );
  }
  if (preview === "editorial") {
    return (
      <div style={wrap}>
        <div
          style={{
            borderBottom: `1px solid ${accent}20`,
            paddingBottom: 6 * scale,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 7 * scale,
            letterSpacing: 1,
            textTransform: "uppercase",
            opacity: 0.6,
          }}
        >
          <span>Vol. 12</span>
          <span>Apr 2026</span>
        </div>
        <div style={{ fontSize: 26 * scale, ...serif, lineHeight: 1, marginTop: 4 * scale, fontStyle: "italic" }}>
          Slow letters,
          <br />
          fast ideas.
        </div>
        <div style={{ display: "flex", gap: 6 * scale, marginTop: 4 * scale }}>
          <div style={{ flex: 1, height: 30 * scale, background: `${accent}15`, borderRadius: 2 * scale }} />
          <div style={{ flex: 1, fontSize: 6 * scale, lineHeight: 1.5, opacity: 0.7 }}>
            This week we&apos;re reading about attention, monks, and the death of the inbox.
          </div>
        </div>
        <div style={{ fontSize: 6 * scale, opacity: 0.5, marginTop: "auto", fontStyle: "italic" }}>— Continue reading</div>
      </div>
    );
  }
  if (preview === "sale") {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 7 * scale, fontWeight: 700, letterSpacing: 2 }}>LIMITED · 48 HOURS</div>
        <div
          style={{
            fontSize: 36 * scale,
            fontWeight: 900,
            lineHeight: 0.9,
            marginTop: 4 * scale,
            color: accent,
            letterSpacing: -1,
          }}
        >
          40%
          <br />
          OFF.
        </div>
        <div style={{ fontSize: 8 * scale, marginTop: 4 * scale, fontWeight: 500 }}>Everything. No exclusions.</div>
        <div
          style={{
            marginTop: "auto",
            padding: `${6 * scale}px ${10 * scale}px`,
            background: accent,
            color: bg,
            fontSize: 8 * scale,
            fontWeight: 700,
            alignSelf: "flex-start",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Shop now →
        </div>
      </div>
    );
  }
  if (preview === "minimal") {
    return (
      <div style={{ ...wrap, padding: 18 * scale }}>
        <div style={{ width: 14 * scale, height: 14 * scale, background: accent, borderRadius: 3 * scale }} />
        <div style={{ fontSize: 10 * scale, fontWeight: 600, marginTop: 10 * scale }}>Changelog · v2.4</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 * scale, marginTop: 8 * scale }}>
          {["New: Realtime collaboration", "Improved: Search 3× faster", "Fixed: Editor cursor jump"].map((t, i) => (
            <div key={i} style={{ fontSize: 7 * scale, paddingLeft: 8 * scale, position: "relative", opacity: 0.85 }}>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 4 * scale,
                  width: 3 * scale,
                  height: 3 * scale,
                  background: accent,
                  borderRadius: "50%",
                }}
              />
              {t}
            </div>
          ))}
        </div>
        <div style={{ marginTop: "auto", fontSize: 6 * scale, opacity: 0.5 }}>See full notes →</div>
      </div>
    );
  }
  if (preview === "welcome") {
    return (
      <div style={wrap}>
        <div
          style={{
            width: 22 * scale,
            height: 22 * scale,
            background: accent,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: bg,
            fontSize: 10 * scale,
            fontWeight: 600,
          }}
        >
          M
        </div>
        <div style={{ fontSize: 18 * scale, ...serif, lineHeight: 1.1, marginTop: 6 * scale }}>
          Hi there,
          <br />
          welcome in.
        </div>
        <div style={{ fontSize: 7 * scale, lineHeight: 1.5, opacity: 0.8, marginTop: 4 * scale }}>
          We&apos;re glad you&apos;re here. Three quick things to get you started:
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 * scale, marginTop: 4 * scale }}>
          {["Set up your profile", "Invite your team", "Send your first email"].map((t, i) => (
            <div key={i} style={{ fontSize: 6 * scale, display: "flex", gap: 4 * scale, alignItems: "center" }}>
              <div
                style={{
                  width: 8 * scale,
                  height: 8 * scale,
                  border: `1px solid ${accent}`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 5 * scale,
                }}
              >
                {i + 1}
              </div>
              {t}
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (preview === "event") {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 7 * scale, opacity: 0.6, letterSpacing: 1, textTransform: "uppercase" }}>You&apos;re invited</div>
        <div style={{ fontSize: 20 * scale, ...serif, lineHeight: 1.05, marginTop: 4 * scale }}>
          An evening
          <br />
          of ideas.
        </div>
        <div
          style={{
            marginTop: 6 * scale,
            padding: 8 * scale,
            border: `1px solid ${accent}30`,
            borderRadius: 4 * scale,
            fontSize: 7 * scale,
            lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 600 }}>May 14 · 7:00 PM</div>
          <div style={{ opacity: 0.7 }}>The Foundry, Brooklyn</div>
        </div>
        <div style={{ marginTop: "auto", display: "flex", gap: 4 * scale }}>
          <div
            style={{
              padding: `${4 * scale}px ${8 * scale}px`,
              background: accent,
              color: bg,
              fontSize: 6 * scale,
              borderRadius: 999,
            }}
          >
            RSVP yes
          </div>
          <div
            style={{
              padding: `${4 * scale}px ${8 * scale}px`,
              border: `1px solid ${accent}40`,
              fontSize: 6 * scale,
              borderRadius: 999,
            }}
          >
            Maybe
          </div>
        </div>
      </div>
    );
  }
  if (preview === "digest") {
    const items = ["The case for slower email", "Why notifications are broken", "A new way to read"];
    return (
      <div style={wrap}>
        <div style={{ fontSize: 8 * scale, ...serif, fontStyle: "italic" }}>The Weekly</div>
        <div style={{ fontSize: 15 * scale, fontWeight: 600, marginTop: 2 * scale, lineHeight: 1.1 }}>
          5 things worth your attention this week.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 * scale, marginTop: 6 * scale }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ display: "flex", gap: 4 * scale, fontSize: 6 * scale, lineHeight: 1.3 }}>
              <span style={{ fontWeight: 700 }}>0{i}</span>
              <span style={{ opacity: 0.8 }}>{items[i - 1]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (preview === "thanks") {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 28 * scale, ...serif, lineHeight: 1, marginTop: 10 * scale, fontStyle: "italic" }}>
          Thank
          <br />
          you.
        </div>
        <div style={{ fontSize: 7 * scale, marginTop: 6 * scale, lineHeight: 1.5, opacity: 0.8 }}>
          Your order #2841 is on its way. We hand-pack every order and we genuinely appreciate you.
        </div>
        <div style={{ marginTop: "auto", fontSize: 6 * scale, opacity: 0.6, fontStyle: "italic" }}>— The team</div>
      </div>
    );
  }
  if (preview === "feature") {
    return (
      <div style={wrap}>
        <div
          style={{
            fontSize: 7 * scale,
            fontWeight: 600,
            color: accent,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          ★ Spotlight
        </div>
        <div style={{ fontSize: 14 * scale, fontWeight: 600, marginTop: 4 * scale, lineHeight: 1.15 }}>Meet smart blocks.</div>
        <div
          style={{
            flex: 1,
            marginTop: 6 * scale,
            background: `linear-gradient(135deg, ${accent}25, ${accent}10)`,
            borderRadius: 4 * scale,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 6 * scale,
              border: `1px dashed ${accent}40`,
              borderRadius: 2 * scale,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 6 * scale,
              opacity: 0.6,
            }}
          >
            preview
          </div>
        </div>
        <div style={{ fontSize: 6 * scale, opacity: 0.7 }}>Drag, drop, done.</div>
      </div>
    );
  }
  if (preview === "survey") {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 12 * scale, fontWeight: 600, lineHeight: 1.2 }}>How did we do?</div>
        <div style={{ fontSize: 7 * scale, opacity: 0.7, marginTop: 2 * scale }}>One quick question.</div>
        <div style={{ display: "flex", gap: 3 * scale, marginTop: 8 * scale, justifyContent: "space-between" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                aspectRatio: "1",
                border: `1px solid ${accent}30`,
                borderRadius: 3 * scale,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8 * scale,
                fontWeight: 500,
                background: i === 4 ? accent : "transparent",
                color: i === 4 ? bg : accent,
              }}
            >
              {i}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 5 * scale,
            opacity: 0.5,
            marginTop: 2 * scale,
          }}
        >
          <span>Awful</span>
          <span>Great</span>
        </div>
      </div>
    );
  }
  if (preview === "reengage") {
    return (
      <div style={wrap}>
        <div style={{ fontSize: 22 * scale, ...serif, lineHeight: 1, fontStyle: "italic", marginTop: 8 * scale }}>
          We&apos;ve missed you.
        </div>
        <div style={{ fontSize: 7 * scale, marginTop: 6 * scale, lineHeight: 1.5, opacity: 0.85 }}>
          It&apos;s been a minute. Here&apos;s what&apos;s new since you last visited:
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2 * scale,
            marginTop: 4 * scale,
            fontSize: 6 * scale,
            opacity: 0.8,
          }}
        >
          <span>· 12 new templates</span>
          <span>· AI is 2× faster</span>
          <span>· Custom brand kits</span>
        </div>
        <div
          style={{
            marginTop: "auto",
            padding: `${4 * scale}px ${8 * scale}px`,
            background: accent,
            color: bg,
            fontSize: 7 * scale,
            borderRadius: 2 * scale,
            alignSelf: "flex-start",
          }}
        >
          Come back →
        </div>
      </div>
    );
  }
  if (preview === "referral") {
    return (
      <div style={wrap}>
        <div style={{ display: "flex", gap: 4 * scale, alignItems: "center" }}>
          <div style={{ width: 14 * scale, height: 14 * scale, borderRadius: "50%", background: accent }} />
          <div
            style={{
              width: 14 * scale,
              height: 14 * scale,
              borderRadius: "50%",
              background: `${accent}60`,
              marginLeft: -8 * scale,
            }}
          />
          <div
            style={{
              width: 14 * scale,
              height: 14 * scale,
              borderRadius: "50%",
              background: `${accent}30`,
              marginLeft: -8 * scale,
            }}
          />
        </div>
        <div style={{ fontSize: 14 * scale, fontWeight: 600, marginTop: 6 * scale, lineHeight: 1.15 }}>
          Bring a friend, get $20.
        </div>
        <div
          style={{
            marginTop: 6 * scale,
            padding: 6 * scale,
            background: `${accent}10`,
            borderRadius: 3 * scale,
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: 7 * scale,
            fontWeight: 600,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          SHARE-MINT
        </div>
        <div style={{ fontSize: 6 * scale, opacity: 0.6, marginTop: "auto" }}>Tap to copy your code</div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={{ fontSize: 10 * scale }}>{name}</div>
    </div>
  );
}
