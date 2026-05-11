"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banner, Card, Icon, ProgressBar } from "@madoo/ui";
import type { CampaignAnalyticsDto, EmailDto, WorkspaceOverviewDto } from "@madoo/shared";
import { analyticsApi, analyticsKeys } from "@/actions/analytics";
import { campaignsApi, campaignsKeys } from "@/actions/campaigns";
import { useEmails } from "@/hooks/use-emails";

function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

function emailHeadline(email: EmailDto | undefined): string | undefined {
  if (!email) return undefined;
  const title = email.title?.trim();
  if (title) return title;
  const p = email.prompt;
  return p.length > 80 ? `${p.slice(0, 80)}…` : p;
}

function variantSubject(email: EmailDto | undefined): string | undefined {
  if (!email || email.variants.length === 0) return undefined;
  return email.variants[email.variants.length - 1]?.subject ?? undefined;
}

function buildPathFromTimeseries(
  points: CampaignAnalyticsDto["opensTimeseries"],
): { path: string; coords: { x: number; y: number }[]; labels: string[] } | null {
  if (points.length < 2) return null;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 600;
    const y = 200 - p.cumulativeOpenRate * 180;
    return { x, y };
  });
  const path = coords
    .map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`))
    .join(" ");
  const labels = points.map((p) => {
    const h = p.hoursSinceSend;
    if (h === 0) return "0h";
    if (h < 24) return `${h}h`;
    return `${Math.round(h / 24)}d`;
  });
  return { path, coords, labels };
}

export function AnalyticsScreen() {
  const campaignsQuery = useQuery({
    queryKey: campaignsKeys.list(),
    queryFn: campaignsApi.list,
  });
  const overviewQuery = useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: analyticsApi.overview,
    staleTime: 30_000,
  });
  const emailsQuery = useEmails(true);

  const sentCampaigns = useMemo(
    () => (campaignsQuery.data ?? []).filter((c) => c.status === "sent"),
    [campaignsQuery.data],
  );

  const [selection, setSelection] = useState<string>("all");
  useEffect(() => {
    if (selection !== "all") return;
    if (sentCampaigns.length === 0) return;
    // keep "all" as default; user can opt into a specific campaign
  }, [sentCampaigns, selection]);

  const isAll = selection === "all";
  const selectedCampaignId = isAll ? null : selection;

  const campaignAnalyticsQuery = useQuery({
    queryKey: selectedCampaignId
      ? analyticsKeys.campaign(selectedCampaignId)
      : ["analytics", "campaign", "noop"],
    queryFn: () => analyticsApi.campaign(selectedCampaignId!),
    enabled: Boolean(selectedCampaignId),
    staleTime: 15_000,
  });

  const emailById = useMemo(() => {
    const map = new Map<string, EmailDto>();
    for (const mail of emailsQuery.data ?? []) map.set(mail.id, mail);
    return map;
  }, [emailsQuery.data]);

  const focusCampaign = isAll ? undefined : sentCampaigns.find((c) => c.id === selectedCampaignId);
  const focusEmail = focusCampaign ? emailById.get(focusCampaign.emailId) : undefined;
  const headline = emailHeadline(focusEmail);
  const subjectLine = variantSubject(focusEmail);

  const overview = overviewQuery.data;
  const analytics = campaignAnalyticsQuery.data;
  const chart = !isAll && analytics ? buildPathFromTimeseries(analytics.opensTimeseries) : null;

  const kpis = useMemo(() => {
    if (isAll && overview) {
      return {
        delivered: {
          value: formatCount(overview.totals.delivered),
          sub: `${formatCount(overview.totals.totalRecipients)} recipients across ${overview.totals.campaignsSent} ${overview.totals.campaignsSent === 1 ? "campaign" : "campaigns"}`,
        },
        opens: {
          value: formatCount(overview.totals.opened),
          sub: `${formatPercent(overview.averages.openRate)} avg open rate`,
        },
        clicks: {
          value: formatCount(overview.totals.clicked),
          sub: `${formatPercent(overview.averages.clickRate)} avg click rate`,
        },
        unsubscribed: {
          value: formatCount(overview.totals.unsubscribed),
          sub: `${formatPercent(overview.averages.unsubscribeRate)} avg rate`,
        },
      };
    }
    if (!isAll && analytics) {
      return {
        delivered: {
          value: formatCount(analytics.stats.delivered),
          sub: `${formatPercent(analytics.stats.deliveryRate)} of sent`,
        },
        opens: {
          value: formatCount(analytics.stats.uniqueOpens),
          sub: `${formatPercent(analytics.stats.openRate)} open rate`,
        },
        clicks: {
          value: formatCount(analytics.stats.uniqueClicks),
          sub: `${formatPercent(analytics.stats.clickRate)} click rate`,
        },
        unsubscribed: {
          value: formatCount(analytics.stats.unsubscribed),
          sub: `${formatPercent(analytics.stats.unsubscribeRate)} rate`,
        },
      };
    }
    return null;
  }, [analytics, isAll, overview]);

  const topLinks = isAll ? overview?.topLinks ?? [] : analytics?.topLinks ?? [];
  const deliveryBreakdown = isAll
    ? overview?.deliveryBreakdown
    : analytics?.deliveryBreakdown;

  const isInitialLoading =
    (campaignsQuery.isPending || overviewQuery.isPending) &&
    !campaignsQuery.data &&
    !overviewQuery.data;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <div className="madoo-screen-pad" style={{ maxWidth: 1280, margin: "0 auto" }}>
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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
            marginTop: 6,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              className="serif"
              style={{ fontSize: 36, fontWeight: 400, margin: 0, letterSpacing: -0.5 }}
            >
              {isInitialLoading
                ? "Analytics"
                : isAll
                  ? "All campaigns"
                  : (headline ?? "Send a campaign to see insights")}
            </h1>
            <div style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 6, fontStyle: "italic" }}>
              {isAll ? (
                overview && overview.totals.campaignsSent > 0 ? (
                  <>
                    Aggregated across {overview.totals.campaignsSent}{" "}
                    {overview.totals.campaignsSent === 1 ? "campaign" : "campaigns"}.
                  </>
                ) : (
                  <>Open and click events stream in once your first campaign ships.</>
                )
              ) : focusCampaign ? (
                <>
                  &quot;{subjectLine ?? "—"}&quot;
                  {focusCampaign.sentAt ? (
                    <> · sent {new Date(focusCampaign.sentAt).toLocaleString()}</>
                  ) : null}
                </>
              ) : (
                <>Open and click events stream in once your first campaign ships.</>
              )}
            </div>
          </div>

          {sentCampaigns.length > 0 ? (
            <select
              value={selection}
              onChange={(e) => setSelection(e.target.value || "all")}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 13,
                color: "var(--ink)",
                minWidth: 220,
              }}
              aria-label="Select campaign or view all"
            >
              <option value="all">All campaigns</option>
              {sentCampaigns.map((c) => {
                const mail = emailById.get(c.emailId);
                const label = emailHeadline(mail) ?? `Campaign ${c.id.slice(0, 6)}`;
                return (
                  <option key={c.id} value={c.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          ) : null}
        </div>

        {campaignAnalyticsQuery.isError ? (
          <Banner tone="danger" style={{ marginTop: 18 }}>
            Could not load analytics for this campaign.
          </Banner>
        ) : null}

        <div
          className="madoo-grid-metrics"
          style={{
            marginTop: 28,
          }}
        >
          {[
            {
              label: "Delivered",
              value: kpis?.delivered.value ?? "—",
              sub: kpis?.delivered.sub ?? (isAll ? "No campaigns sent yet" : "Awaiting webhook"),
              accent: "#2F5C42",
            },
            {
              label: "Opens",
              value: kpis?.opens.value ?? "—",
              sub: kpis?.opens.sub ?? "Pixel records on render",
              accent: "#5B5FCB",
            },
            {
              label: "Clicks",
              value: kpis?.clicks.value ?? "—",
              sub: kpis?.clicks.sub ?? "Tracked links rewrite at send",
              accent: "#A87E54",
            },
            {
              label: "Unsubscribed",
              value: kpis?.unsubscribed.value ?? "—",
              sub: kpis?.unsubscribed.sub ?? "From list-unsubscribe events",
              accent: "#A23E2F",
            },
          ].map((s) => (
            <Card
              key={s.label}
              padded
              style={{ position: "relative", overflow: "hidden", paddingTop: 22 }}
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
            </Card>
          ))}
        </div>

        <Card padded style={{ marginTop: 24, padding: 24 }}>
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
                {isAll
                  ? "Pick a campaign above to see its open curve"
                  : "Cumulative unique opens since send"}
              </div>
            </div>
          </div>

          <div style={{ position: "relative", height: 220 }}>
            {isAll ? (
              <div
                style={{
                  display: "flex",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "var(--ink-faint)",
                  fontStyle: "italic",
                }}
              >
                The opens curve is anchored to a single send time — switch to a campaign to view it.
              </div>
            ) : chart && analytics ? (
              <svg
                viewBox="0 0 600 220"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
              >
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
                <path
                  d={`${chart.path} L 600 200 L 0 200 Z`}
                  fill="var(--accent)"
                  opacity="0.15"
                />
                <path d={chart.path} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
                {chart.coords.map((c, i) => (
                  <circle
                    key={i}
                    cx={c.x}
                    cy={c.y}
                    r="3.5"
                    fill="var(--surface)"
                    stroke="var(--accent)"
                    strokeWidth="2"
                  />
                ))}
                {chart.labels.map((l, i) => (
                  <text
                    key={`${l}-${i}`}
                    x={(i / (chart.labels.length - 1)) * 600}
                    y="218"
                    fontSize="10"
                    fill="var(--ink-faint)"
                    textAnchor="middle"
                  >
                    {l}
                  </text>
                ))}
              </svg>
            ) : (
              <div
                style={{
                  display: "flex",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  color: "var(--ink-faint)",
                  fontStyle: "italic",
                }}
              >
                {focusCampaign
                  ? campaignAnalyticsQuery.isPending
                    ? "Loading opens…"
                    : "No opens recorded yet."
                  : "Send a campaign to populate this chart."}
              </div>
            )}
          </div>
        </Card>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}
        >
          <Card padded style={{ padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
              {isAll ? "Top clicked links · workspace" : "Top clicked links"}
            </div>
            {topLinks.length > 0 ? (
              topLinks.map((l) => (
                <div key={l.url} style={{ marginTop: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12.5,
                      marginBottom: 4,
                      gap: 12,
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        color: "var(--ink)",
                        fontSize: 12,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={l.url}
                    >
                      {l.url}
                    </span>
                    <span
                      style={{
                        color: "var(--ink-soft)",
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.clicks} · {formatPercent(l.share, 0)}
                    </span>
                  </div>
                  <ProgressBar
                    value={Math.round(l.share * 100)}
                    variant="thin"
                    aria-label={`${l.url} share of clicks`}
                  />
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic" }}>
                {isAll
                  ? sentCampaigns.length === 0
                    ? "Send a campaign to track links."
                    : "No clicks tracked yet."
                  : focusCampaign
                    ? "No clicks tracked yet."
                    : "Send a campaign to track links."}
              </div>
            )}
          </Card>

          <Card padded style={{ padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
              {isAll ? "Delivery breakdown · workspace" : "Delivery breakdown"}
            </div>
            {deliveryBreakdown ? (
              (() => {
                const b = deliveryBreakdown;
                const total =
                  b.pending + b.sent + b.opened + b.clicked + b.bounced + b.unsubscribed + b.complained;
                const rows = [
                  { label: "Sent", n: b.sent + b.opened + b.clicked, color: "var(--ink-soft)" },
                  { label: "Opened", n: b.opened + b.clicked, color: "#5B5FCB" },
                  { label: "Clicked", n: b.clicked, color: "#A87E54" },
                  { label: "Bounced", n: b.bounced, color: "#A23E2F" },
                  { label: "Unsubscribed", n: b.unsubscribed, color: "#7c6f63" },
                  { label: "Complained", n: b.complained, color: "#A23E2F" },
                ];
                return rows.map((r) => {
                  const pct = total === 0 ? 0 : Math.round((r.n / total) * 100);
                  return (
                    <div key={r.label} style={{ marginTop: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12.5,
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "var(--ink)" }}>{r.label}</span>
                        <span
                          style={{
                            color: "var(--ink-soft)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {r.n} · {pct}%
                        </span>
                      </div>
                      <ProgressBar value={pct} variant="thin" aria-label={`${r.label} share`} />
                    </div>
                  );
                });
              })()
            ) : (
              <div style={{ fontSize: 13, color: "var(--ink-faint)", fontStyle: "italic" }}>
                {isAll || focusCampaign ? "Loading delivery breakdown…" : "—"}
              </div>
            )}
          </Card>
        </div>

        {overview && overview.recentCampaigns.length > 0 ? (
          <Card padded style={{ padding: 22, marginTop: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Recent campaigns</div>
            <div style={{ display: "grid", gap: 8 }}>
              {overview.recentCampaigns.map((row) => {
                const isSelected = row.campaignId === selectedCampaignId;
                return (
                  <button
                    key={row.campaignId}
                    type="button"
                    onClick={() => setSelection(row.campaignId)}
                    className="madoo-analytics-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) 100px 100px 100px",
                      gap: 12,
                      alignItems: "center",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border-soft)",
                      background: isSelected ? "var(--bg-2)" : "var(--surface)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 13,
                      color: "var(--ink)",
                    }}
                  >
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 500 }}>
                        {row.emailTitle ?? row.subject ?? `Campaign ${row.campaignId.slice(0, 6)}`}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 2 }}>
                        {row.sentAt ? new Date(row.sentAt).toLocaleString() : "Not sent"}
                      </div>
                    </div>
                    <div style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-soft)" }}>
                      {row.totalRecipients.toLocaleString()} sent
                    </div>
                    <div style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-soft)" }}>
                      {formatPercent(row.openRate)} open
                    </div>
                    <div style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink-soft)" }}>
                      {formatPercent(row.clickRate)} click
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
