"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Campaign, CampaignStatus, EmailDto } from "@madoo/shared";
import { Badge, Banner, Button, Card, Icon, SegmentedControl, type BadgeTone } from "@madoo/ui";
import { auditLogKeys } from "@/actions/audit-log";
import { analyticsApi, analyticsKeys } from "@/actions/analytics";
import { campaignsApi, campaignsKeys } from "@/actions/campaigns";
import { segmentsApi, segmentsKeys } from "@/actions/segments";
import { useEmails } from "@/hooks/use-emails";
import { CampaignDetailModal } from "./CampaignDetailModal";
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

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function emailHeadline(email: EmailDto | undefined): string {
  if (!email) return "—";
  const title = email.title?.trim();
  if (title) return title;
  const p = email.prompt;
  return p.length > 72 ? `${p.slice(0, 72)}…` : p;
}

function variantSubject(email: EmailDto | undefined): string {
  if (!email || email.variants.length === 0) return "—";
  const variant = email.variants[email.variants.length - 1];
  return variant.subject ?? "—";
}

function campaignTiming(row: Campaign): string {
  if (row.status === "sending") return "Sending now";
  if (row.sentAt) return formatDateTime(row.sentAt);
  if (row.scheduledFor) return formatDateTime(row.scheduledFor);
  return "Not sent yet";
}

export function CampaignsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | CampaignStatus>("all");
  const [showCompose, setShowCompose] = useState(false);
  const consumedComposeParamRef = useRef(false);

  const queueSendCampaign = useMutation({
    mutationFn: (campaignId: string) => campaignsApi.send(campaignId),
    onSuccess: (_, campaignId) => {
      void queryClient.invalidateQueries({ queryKey: campaignsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: campaignsKeys.detail(campaignId) });
      void queryClient.invalidateQueries({ queryKey: campaignsKeys.recipients(campaignId) });
      void queryClient.invalidateQueries({ queryKey: auditLogKeys.list() });
      void queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      void queryClient.invalidateQueries({
        predicate: (q) =>
          typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("workspaces"),
      });
    },
  });

  const queueSendErrorMsg =
    queueSendCampaign.error instanceof Error ? queueSendCampaign.error.message : null;

  const campaignsQuery = useQuery({
    queryKey: campaignsKeys.list(),
    queryFn: campaignsApi.list,
  });

  const segmentsQuery = useQuery({
    queryKey: segmentsKeys.list(),
    queryFn: () => segmentsApi.list(),
    staleTime: 60_000,
  });

  const emailsQuery = useEmails(true);

  const overviewQuery = useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: analyticsApi.overview,
    staleTime: 30_000,
  });

  const ratesByCampaign = useMemo(() => {
    const map = new Map<string, { openRate: number; clickRate: number; recipients: number }>();
    for (const row of overviewQuery.data?.recentCampaigns ?? []) {
      map.set(row.campaignId, {
        openRate: row.openRate,
        clickRate: row.clickRate,
        recipients: row.totalRecipients,
      });
    }
    return map;
  }, [overviewQuery.data]);

  const segmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of segmentsQuery.data ?? []) {
      map.set(s.id, s.name);
    }
    return map;
  }, [segmentsQuery.data]);

  const emailById = useMemo(() => {
    const map = new Map<string, EmailDto>();
    for (const email of emailsQuery.data ?? []) {
      map.set(email.id, email);
    }
    return map;
  }, [emailsQuery.data]);

  const filtered = useMemo(() => {
    const rows = campaignsQuery.data ?? [];
    if (filter === "all") return rows;
    return rows.filter((row) => row.status === filter);
  }, [campaignsQuery.data, filter]);

  const detailCampaignId = searchParams.get("campaign");
  const detailPreview = useMemo(
    () => (campaignsQuery.data ?? []).find((row) => row.id === detailCampaignId),
    [campaignsQuery.data, detailCampaignId],
  );

  const openCampaignDetail = (id: string) => {
    router.replace(`/campaigns?campaign=${encodeURIComponent(id)}`);
  };

  const stripComposeEditParamsAndNavigate = () => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("compose");
    p.delete("edit");
    const q = p.toString();
    router.replace(q ? `/campaigns?${q}` : "/campaigns");
  };

  const openComposeResume = (campaignId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    router.replace(`/campaigns?edit=${encodeURIComponent(campaignId)}`);
    setShowCompose(true);
  };

  const closeCompose = () => {
    setShowCompose(false);
    stripComposeEditParamsAndNavigate();
    consumedComposeParamRef.current = false;
  };

  const closeCampaignDetail = () => {
    queueSendCampaign.reset();
    const p = new URLSearchParams(searchParams.toString());
    p.delete("campaign");
    const q = p.toString();
    router.replace(q ? `/campaigns?${q}` : "/campaigns");
  };

  const metrics = useMemo(() => {
    const rows = campaignsQuery.data ?? [];
    const sent = rows.filter((c) => c.status === "sent").length;
    const drafts = rows.filter((c) => c.status === "draft").length;
    const queued = rows.filter((c) => c.status === "scheduled" || c.status === "sending").length;
    return {
      rows,
      sent,
      drafts,
      queued,
    };
  }, [campaignsQuery.data]);

  useEffect(() => {
    if (searchParams.get("edit")) {
      setShowCompose(true);
      return;
    }
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
              onClick={() => {
                router.replace("/campaigns?compose=1");
                consumedComposeParamRef.current = false;
                setShowCompose(true);
              }}
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
              { label: "Total campaigns", value: String(metrics.rows.length), helper: "—" },
              { label: "Sent", value: String(metrics.sent), helper: "lifecycle" },
              { label: "Drafts", value: String(metrics.drafts), helper: "not queued" },
              { label: "Scheduled / sending", value: String(metrics.queued), helper: "queued" },
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
                    {campaignsQuery.isPending ? "…" : s.value}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", fontWeight: 600 }}>
                    {s.helper}
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
            {campaignsQuery.isError ? (
              <Banner tone="danger" style={{ margin: 18 }}>
                Could not load campaigns.
              </Banner>
            ) : null}
            {queueSendErrorMsg ? (
              <Banner tone="danger" style={{ margin: "0 18px 14px", marginTop: campaignsQuery.isError ? 0 : 18 }}>
                {queueSendErrorMsg}
              </Banner>
            ) : null}
            {campaignsQuery.isPending ? (
              <div style={{ padding: 28, fontSize: 13, color: "var(--ink-soft)" }}>Loading campaigns…</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 28, fontSize: 13, color: "var(--ink-soft)" }}>No campaigns yet.</div>
            ) : (
              filtered.map((c, i) => {
                const email = emailById.get(c.emailId);
                const draftOrScheduled = c.status === "draft" || c.status === "scheduled";
                return (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open campaign details: ${emailHeadline(email)}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) 148px 128px 110px 90px minmax(150px, auto)",
                      gap: 12,
                      padding: "18px 20px",
                      borderTop: i === 0 ? "none" : "1px solid var(--border-soft)",
                      alignItems: "center",
                      cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                    onClick={() => openCampaignDetail(c.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openCampaignDetail(c.id);
                      }
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
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{emailHeadline(email)}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>
                        &quot;{variantSubject(email)}&quot;
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                      <div style={{ fontWeight: 500, color: "var(--ink)" }}>
                        {segmentNameById.get(c.segmentId) ?? "Audience"}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                        {ratesByCampaign.get(c.id)?.recipients
                          ? `${ratesByCampaign.get(c.id)!.recipients.toLocaleString()} recipients`
                          : c.status === "sent"
                            ? "—"
                            : "Not sent yet"}
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{campaignTiming(c)}</div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                        {c.status === "sent" && ratesByCampaign.has(c.id)
                          ? `${(ratesByCampaign.get(c.id)!.openRate * 100).toFixed(1)}%`
                          : "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>open rate</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                        {c.status === "sent" && ratesByCampaign.has(c.id)
                          ? `${(ratesByCampaign.get(c.id)!.clickRate * 100).toFixed(1)}%`
                          : "—"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--ink-faint)" }}>click rate</div>
                    </div>
                    <div style={{ justifySelf: "end" }}>
                      {draftOrScheduled ? (
                        <div
                          style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            type="button"
                            onClick={(e) => openComposeResume(c.id, e)}
                          >
                            Continue
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            type="button"
                            leftIcon={<Icon name="send" size={11} />}
                            disabled={queueSendCampaign.isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              queueSendCampaign.reset();
                              queueSendCampaign.mutate(c.id);
                            }}
                          >
                            Send
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </Card>
        </div>
      </div>

      {showCompose ? (
        <ComposeModal
          key={searchParams.get("edit") ?? "compose-new"}
          resumeCampaignId={searchParams.get("edit")}
          onClose={closeCompose}
        />
      ) : null}

      {detailCampaignId ? (
        <CampaignDetailModal
          campaignId={detailCampaignId}
          onClose={closeCampaignDetail}
          previewFromList={detailPreview}
          onContinueDraft={(id) => openComposeResume(id)}
          onQueueSend={(id) => {
            queueSendCampaign.reset();
            queueSendCampaign.mutate(id);
          }}
          queueSendPending={queueSendCampaign.isPending}
          queueSendError={queueSendErrorMsg}
        />
      ) : null}
    </>
  );
}
