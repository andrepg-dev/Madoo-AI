"use client";

import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  Campaign,
  CampaignDeliveryStatus,
  CampaignStatus,
  EmailDto,
} from "@madoo/shared";
import { Badge, Banner, Button, Icon, Modal, type BadgeTone } from "@madoo/ui";
import { campaignsApi, campaignsKeys } from "@/actions/campaigns";
import { segmentsApi, segmentsKeys } from "@/actions/segments";
import { useEmails } from "@/hooks/use-emails";

const STATUS_TONE: Record<CampaignStatus, BadgeTone> = {
  sent: "success",
  sending: "warn",
  scheduled: "info",
  draft: "neutral",
};

const DELIVERY_STATUS_TONE: Record<CampaignDeliveryStatus, BadgeTone> = {
  pending: "neutral",
  sent: "success",
  opened: "info",
  clicked: "info",
  bounced: "danger",
  unsubscribed: "warn",
  complained: "danger",
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
  return p.length > 120 ? `${p.slice(0, 120)}…` : p;
}

function variantSubject(email: EmailDto | undefined): string {
  if (!email || email.variants.length === 0) return "—";
  const variant = email.variants[email.variants.length - 1];
  return variant.subject ?? "—";
}

function recipientContactName(first: string | null, last: string | null): string {
  const parts = [first?.trim(), last?.trim()].filter((p): p is string => Boolean(p && p.length > 0));
  return parts.length > 0 ? parts.join(" ") : "—";
}

type DetailRowProps = { label: string; children: ReactNode; hideBorder?: boolean };

function DetailRow({ label, children, hideBorder }: DetailRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 14,
        padding: "12px 0",
        borderBottom: hideBorder ? "none" : "1px solid var(--border-soft)",
        fontSize: 13,
        alignItems: "start",
      }}
    >
      <div style={{ color: "var(--ink-faint)", fontWeight: 500 }}>{label}</div>
      <div style={{ color: "var(--ink)", wordBreak: "break-word" }}>{children}</div>
    </div>
  );
}

export function CampaignDetailModal({
  campaignId,
  onClose,
  previewFromList,
  onContinueDraft,
  onQueueSend,
  queueSendPending,
  queueSendError,
}: {
  campaignId: string;
  onClose: () => void;
  previewFromList?: Campaign;
  onContinueDraft?: (id: string) => void;
  onQueueSend?: (id: string) => void;
  queueSendPending?: boolean;
  queueSendError?: string | null;
}) {
  const detailQuery = useQuery({
    queryKey: campaignsKeys.detail(campaignId),
    queryFn: () => campaignsApi.get(campaignId),
    enabled: !!campaignId,
    placeholderData: previewFromList,
  });

  const recipientsQuery = useQuery({
    queryKey: campaignsKeys.recipients(campaignId),
    queryFn: () => campaignsApi.listRecipients(campaignId),
    enabled: !!campaignId && !!detailQuery.data && !detailQuery.isError,
  });

  const emailsQuery = useEmails(true);
  const segmentsQuery = useQuery({
    queryKey: segmentsKeys.list(),
    queryFn: () => segmentsApi.list(),
    staleTime: 60_000,
  });

  const c = detailQuery.data;

  const resolvedEmail = useMemo((): EmailDto | undefined => {
    const emailId = c?.emailId;
    if (!emailId) return undefined;
    return emailsQuery.data?.find((row) => row.id === emailId);
  }, [c?.emailId, emailsQuery.data]);

  const audienceLabel = useMemo(() => {
    if (!c) return undefined;
    const name = segmentsQuery.data?.find((row) => row.id === c.segmentId)?.name;
    return name ?? c.segmentId;
  }, [c, segmentsQuery.data]);

  const headline = emailHeadline(resolvedEmail);
  const subject = variantSubject(resolvedEmail);

  const canDraftActions =
    !!c &&
    (c.status === "draft" || c.status === "scheduled") &&
    Boolean(onContinueDraft || onQueueSend);

  const footerInner = (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <Button variant="secondary" size="md" onClick={onClose}>
        Close
      </Button>
    </div>
  );

  return (
    <Modal
      open={!!campaignId}
      onClose={onClose}
      size="lg"
      eyebrow="Campaign"
      title={headline}
      description={subject !== "—" ? `Subject line: "${subject}"` : undefined}
      footer={footerInner}
    >
      {detailQuery.isError ? (
        <Banner tone="danger" style={{ marginBottom: 12 }}>
          Could not load campaign details.
        </Banner>
      ) : null}

      {detailQuery.isPending && !c ? (
        <div style={{ padding: "8px 0", fontSize: 13, color: "var(--ink-soft)" }}>Loading…</div>
      ) : null}

      {c ? (
        <>
          <div style={{ marginBottom: 14 }}>
            <Badge tone={STATUS_TONE[c.status]} dot>
              {c.status.toUpperCase()}
            </Badge>
          </div>

          {canDraftActions ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {onContinueDraft ? (
                  <Button variant="secondary" size="sm" type="button" onClick={() => onContinueDraft(c.id)}>
                    Continue editing
                  </Button>
                ) : null}
                {onQueueSend ? (
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    leftIcon={<Icon name="send" size={12} />}
                    disabled={queueSendPending}
                    onClick={() => onQueueSend(c.id)}
                  >
                    {queueSendPending ? "Queueing send…" : "Send now"}
                  </Button>
                ) : null}
              </div>
              {queueSendError ? (
                <Banner tone="danger" style={{ marginTop: 12 }}>
                  {queueSendError}
                </Banner>
              ) : null}
            </div>
          ) : null}

          <div style={{ marginTop: 4 }}>
            <DetailRow label="Audience">{audienceLabel ?? c.segmentId}</DetailRow>
            <DetailRow label="From">{`${c.fromName} <${c.fromEmail}>`}</DetailRow>
            <DetailRow label="Reply-To">{c.replyTo ?? "—"}</DetailRow>
            <DetailRow label="A/B test">{c.abTest ? "Yes" : "No"}</DetailRow>
            <DetailRow label="Scheduled for">{c.scheduledFor ? formatDateTime(c.scheduledFor) : "—"}</DetailRow>
            <DetailRow label="Sent at">{c.sentAt ? formatDateTime(c.sentAt) : "—"}</DetailRow>
            <DetailRow label="Email ID">{c.emailId}</DetailRow>
            <DetailRow label="Segment ID">{c.segmentId}</DetailRow>
            <DetailRow label="Campaign ID">{c.id}</DetailRow>
            <DetailRow label="Workspace">{c.workspaceId}</DetailRow>
            <DetailRow label="Created">{formatDateTime(c.createdAt)}</DetailRow>
            <DetailRow label="Updated" hideBorder>
              {formatDateTime(c.updatedAt)}
            </DetailRow>
          </div>

          <div style={{ marginTop: 28 }}>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: 0.35,
                textTransform: "uppercase",
                color: "var(--ink-faint)",
                marginBottom: 12,
              }}
            >
              Recipients
              {recipientsQuery.data ? (
                <span style={{ fontWeight: 500, marginLeft: 8, color: "var(--ink-soft)" }}>
                  ({recipientsQuery.data.length})
                </span>
              ) : null}
            </div>

            {recipientsQuery.isError ? (
              <Banner tone="danger">Could not load recipients.</Banner>
            ) : recipientsQuery.isPending ? (
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Loading recipients…</div>
            ) : !recipientsQuery.data || recipientsQuery.data.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>
                No sends recorded yet. Recipients appear here after the campaign is delivered.
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid var(--border-soft)",
                  borderRadius: 8,
                  overflow: "hidden",
                  fontSize: 12.5,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(120px, 1.1fr) minmax(140px, 1.4fr) 100px minmax(100px, 0.9fr)",
                    gap: 0,
                    background: "var(--bg-2)",
                    borderBottom: "1px solid var(--border-soft)",
                  }}
                >
                  {(["Name", "Email", "Status", "Sent"] as const).map((label) => (
                    <div
                      key={label}
                      style={{
                        padding: "10px 12px",
                        fontWeight: 600,
                        color: "var(--ink-faint)",
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {recipientsQuery.data.map((r, idx) => (
                    <div
                      key={r.deliveryId}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(120px, 1.1fr) minmax(140px, 1.4fr) 100px minmax(100px, 0.9fr)",
                        gap: 0,
                        borderTop: idx === 0 ? undefined : "1px solid var(--border-soft)",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ padding: "10px 12px", color: "var(--ink)", fontWeight: 500 }}>
                        {recipientContactName(r.firstName, r.lastName)}
                      </div>
                      <div
                        style={{ padding: "10px 12px", color: "var(--ink-soft)", wordBreak: "break-all" }}
                      >
                        {r.email}
                      </div>
                      <div style={{ padding: "8px 12px" }}>
                        <Badge tone={DELIVERY_STATUS_TONE[r.status]} dot>
                          {r.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div
                        style={{
                          padding: "10px 12px",
                          color: "var(--ink-soft)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.sentAt ? formatDateTime(r.sentAt) : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--border-soft)",
              fontSize: 12,
              color: "var(--ink-faint)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="sparkle" size={12} />
            Opens, clicks, and delivery stats arrive in phase 4.
          </div>
        </>
      ) : null}
    </Modal>
  );
}
