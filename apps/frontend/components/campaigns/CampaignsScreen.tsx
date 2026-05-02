"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Button, Card, Icon, SegmentedControl, type BadgeTone } from "@madoo/ui";
import { MOCK_CAMPAIGNS, type CampaignStatus } from "@/lib/data";
import { ComposeModal } from "./ComposeModal";

const FILTERS: { value: "all" | CampaignStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
];

const STATUS_TONE: Record<CampaignStatus, BadgeTone> = {
  sent: "success",
  sending: "warn",
  scheduled: "info",
  draft: "neutral",
};

export function CampaignsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<"all" | CampaignStatus>("all");
  const [showCompose, setShowCompose] = useState(false);
  const consumedComposeParamRef = useRef(false);

  const filtered =
    filter === "all" ? MOCK_CAMPAIGNS : MOCK_CAMPAIGNS.filter((c) => c.status === filter);

  useEffect(() => {
    if (searchParams.get("compose") !== "1" || consumedComposeParamRef.current) return;
    consumedComposeParamRef.current = true;
    setShowCompose(true);
  }, [searchParams]);

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
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCompose(true)}
              leftIcon={<Icon name="sparkle" size={13} />}
            >
              New campaign
            </Button>
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
              <Card key={s.label} padded style={{ padding: 18 }}>
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
                  <div style={{ fontSize: 11.5, color: "var(--accent-deep)", fontWeight: 600 }}>
                    {s.delta}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ marginTop: 28, width: "fit-content" }}>
            <SegmentedControl
              items={FILTERS}
              value={filter}
              onChange={(v) => setFilter(v as "all" | CampaignStatus)}
              aria-label="Filter campaigns by status"
            />
          </div>

          <Card style={{ marginTop: 16, marginBottom: 60, overflow: "hidden" }}>
            {filtered.map((c, i) => {
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
                    <div style={{ marginBottom: 4 }}>
                      <Badge tone={STATUS_TONE[c.status]} dot>
                        {c.status.toUpperCase()}
                      </Badge>
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
          </Card>
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
