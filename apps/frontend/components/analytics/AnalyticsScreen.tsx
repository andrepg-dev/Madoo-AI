import { Icon } from "@/components/icons/Icon";
import { MOCK_CAMPAIGNS } from "@/lib/data";

export function AnalyticsScreen() {
  const campaign = MOCK_CAMPAIGNS[0];
  const openData = [12, 22, 38, 64, 78, 88, 94, 96, 98, 99, 100];
  const hoursLabels = ["0h", "2h", "4h", "6h", "8h", "12h", "24h", "48h", "3d", "5d", "7d"];

  const path = `M 0 ${200 - openData[0] * 1.8} ${openData
    .map((v, i) => `L ${(i / (openData.length - 1)) * 600} ${200 - v * 1.8}`)
    .join(" ")}`;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <div style={{ padding: "32px 40px 60px", maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            fontSize: 12,
            color: "var(--ink-faint)",
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          Campaigns <Icon name="chevron" size={11} /> Analytics
        </div>
        <h1
          className="serif"
          style={{ fontSize: 36, fontWeight: 400, margin: "6px 0 0", letterSpacing: -0.5 }}
        >
          {campaign.name}
        </h1>
        <div style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 6, fontStyle: "italic" }}>
          &quot;{campaign.subject}&quot; · sent {campaign.sentAt} to{" "}
          {campaign.recipients.toLocaleString()} contacts
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginTop: 28,
          }}
        >
          {[
            { label: "Delivered", value: "2,801", sub: "98.4% of sent", accent: "#2F5C42" },
            { label: "Opens", value: "1,681", sub: "60.0% open rate", accent: "#5B5FCB" },
            { label: "Clicks", value: "412", sub: "14.7% click rate", accent: "#A87E54" },
            { label: "Unsubscribed", value: "8", sub: "0.3% rate", accent: "#A23E2F" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: 22,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: 3,
                  background: s.accent,
                }}
              />
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--ink-faint)",
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
              <div
                className="serif"
                style={{
                  fontSize: 36,
                  fontWeight: 400,
                  letterSpacing: -1,
                  marginTop: 8,
                  lineHeight: 1,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Opens over time</div>
              <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>
                Cumulative opens since send
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 3,
                background: "var(--surface-2)",
                borderRadius: 7,
                fontSize: 11.5,
              }}
            >
              {["7 days", "30 days", "All time"].map((p, i) => (
                <button
                  key={p}
                  type="button"
                  style={{
                    padding: "4px 10px",
                    borderRadius: 5,
                    border: "none",
                    background: i === 0 ? "var(--surface)" : "transparent",
                    color: i === 0 ? "var(--ink)" : "var(--ink-soft)",
                    fontWeight: i === 0 ? 600 : 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", height: 220 }}>
            <svg viewBox="0 0 600 220" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              {[0, 25, 50, 75, 100].map((v) => (
                <g key={v}>
                  <line
                    x1="0"
                    x2="600"
                    y1={200 - v * 1.8}
                    y2={200 - v * 1.8}
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                  />
                  <text
                    x="-6"
                    y={200 - v * 1.8 + 4}
                    fontSize="10"
                    fill="var(--ink-faint)"
                    textAnchor="end"
                  >
                    {v}%
                  </text>
                </g>
              ))}
              <path d={`${path} L 600 200 L 0 200 Z`} fill="var(--accent)" opacity="0.15" />
              <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
              {openData.map((v, i) => (
                <circle
                  key={i}
                  cx={(i / (openData.length - 1)) * 600}
                  cy={200 - v * 1.8}
                  r="3.5"
                  fill="var(--surface)"
                  stroke="var(--accent)"
                  strokeWidth="2"
                />
              ))}
              {hoursLabels.map((l, i) => (
                <text
                  key={l}
                  x={(i / (hoursLabels.length - 1)) * 600}
                  y="218"
                  fontSize="10"
                  fill="var(--ink-faint)"
                  textAnchor="middle"
                >
                  {l}
                </text>
              ))}
            </svg>
          </div>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}
        >
          <div
            style={{
              padding: 22,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Top clicked links</div>
            {[
              { url: "acme.co/whats-new", clicks: 187, pct: 45 },
              { url: "acme.co/upgrade", clicks: 142, pct: 34 },
              { url: "acme.co/changelog", clicks: 56, pct: 14 },
              { url: "acme.co/unsubscribe", clicks: 27, pct: 7 },
            ].map((l) => (
              <div key={l.url} style={{ marginTop: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    marginBottom: 4,
                  }}
                >
                  <span className="mono" style={{ color: "var(--ink)", fontSize: 12 }}>
                    {l.url}
                  </span>
                  <span
                    style={{
                      color: "var(--ink-soft)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {l.clicks} · {l.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "var(--surface-2)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ width: `${l.pct}%`, height: "100%", background: "var(--accent)" }} />
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              padding: 22,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Where they read it</div>
            {[
              { client: "Apple Mail", pct: 42, n: 706 },
              { client: "Gmail", pct: 31, n: 521 },
              { client: "Outlook", pct: 18, n: 303 },
              { client: "Yahoo", pct: 6, n: 101 },
              { client: "Other", pct: 3, n: 50 },
            ].map((c) => (
              <div key={c.client} style={{ marginTop: 10 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: "var(--ink)" }}>{c.client}</span>
                  <span
                    style={{
                      color: "var(--ink-soft)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {c.n} · {c.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "var(--surface-2)",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ width: `${c.pct}%`, height: "100%", background: "var(--accent)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
