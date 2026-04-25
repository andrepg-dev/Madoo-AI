"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { MOCK_CAMPAIGNS, type CampaignStatus } from "@/lib/data";
import { ComposeModal } from "./ComposeModal";

const FILTERS: { id: "all" | CampaignStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "scheduled", label: "Scheduled" },
  { id: "sending", label: "Sending" },
  { id: "sent", label: "Sent" },
];

const STATUS_STYLES: Record<CampaignStatus, { bg: string; fg: string; dot: string }> = {
  sent: { bg: "#E5EFE6", fg: "#2F5C42", dot: "#2F5C42" },
  sending: { bg: "#FFF1D6", fg: "#7A5A1E", dot: "#D69E2E" },
  scheduled: { bg: "#E5E5F5", fg: "#3B2F8C", dot: "#5B5FCB" },
  draft: { bg: "#F4F0E6", fg: "#5C5246", dot: "#9A8E7F" },
};

export function CampaignsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | CampaignStatus>("all");
  const [showCompose, setShowCompose] = useState(false);

  const filtered =
    filter === "all" ? MOCK_CAMPAIGNS : MOCK_CAMPAIGNS.filter((c) => c.status === filter);

  return (
    <>
      <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
        <div style={{ padding: "32px 40px 16px", maxWidth: 1280, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <h1
                className="serif"
                style={{ fontSize: 36, fontWeight: 400, margin: 0, letterSpacing: -0.5 }}
              >
                Campaigns
              </h1>
              <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 6 }}>
                Plan, send, and track everything you ship.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCompose(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 9,
                border: "none",
                background: "var(--ink)",
                color: "var(--bg)",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Icon name="sparkle" size={13} /> New campaign
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              marginTop: 24,
            }}
          >
            {[
              { label: "Sent this month", value: "4", delta: "+2" },
              { label: "Total recipients", value: "12.4k", delta: "+1.2k" },
              { label: "Avg. open rate", value: "58.2%", delta: "+3.1%" },
              { label: "Avg. click rate", value: "14.6%", delta: "+0.8%" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: 18,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--ink-faint)",
                    fontWeight: 500,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <div
                    className="serif"
                    style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}
                  >
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--accent-deep)", fontWeight: 600 }}>{s.delta}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 4,
              marginTop: 28,
              padding: 4,
              background: "var(--surface-2)",
              borderRadius: 9,
              border: "1px solid var(--border)",
              alignSelf: "flex-start",
              width: "fit-content",
            }}
          >
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "none",
                    background: active ? "var(--surface)" : "transparent",
                    color: active ? "var(--ink)" : "var(--ink-soft)",
                    fontWeight: active ? 600 : 500,
                    fontSize: 12.5,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: active ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 16,
              marginBottom: 60,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {filtered.map((c, i) => {
              const ss = STATUS_STYLES[c.status];
              const openRate = c.recipients ? Math.round((c.opens / c.recipients) * 100) : 0;
              const clickRate = c.recipients ? Math.round((c.clicks / c.recipients) * 100) : 0;
              return (
                <div
                  key={c.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 160px 140px 120px 100px",
                    gap: 16,
                    padding: "18px 20px",
                    borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 600,
                          background: ss.bg,
                          color: ss.fg,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        <div
                          style={{ width: 5, height: 5, borderRadius: "50%", background: ss.dot }}
                        />
                        {c.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>
                      &quot;{c.subject}&quot;
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                    <div style={{ fontWeight: 500, color: "var(--ink)" }}>{c.audience}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                      {c.recipients.toLocaleString()} contacts
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{c.sentAt}</div>
                  <div>
                    {c.status === "sent" || c.status === "sending" ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                          {openRate}%
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>opens</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>—</div>
                    )}
                  </div>
                  <div>
                    {c.status === "sent" || c.status === "sending" ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                          {clickRate}%
                        </div>
                        <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>clicks</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSend={() => {
            setShowCompose(false);
            router.push("/analytics");
          }}
        />
      )}
    </>
  );
}
