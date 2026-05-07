"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banner,
  Button,
  Checkbox,
  Icon,
  Input,
  Modal,
  ProgressBar,
  SelectableCard,
  Select,
  Tag,
} from "@madoo/ui";
import type { Segment } from "@madoo/shared";
import { CSV_FIELDS, PREVIEW_CONTACTS } from "@/lib/data";
import { useEmails } from "@/hooks/use-emails";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceStore } from "@/stores/workspace";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { campaignsApi, campaignsKeys } from "@/actions/campaigns";
import { segmentsApi, segmentsKeys } from "@/actions/segments";
import { auditLogKeys } from "@/actions/audit-log";
import { domainsApi, domainsKeys } from "@/actions/domains";

const SEGMENT_ACCENTS = ["#1F1A12", "#2F5C42", "#A87E54", "#A23E2F", "#5B5FCB"] as const;

function defaultLocalDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function scheduleToIso(schedule: "now" | "later", dateStr: string, timeStr: string): string | undefined {
  if (schedule !== "later") return undefined;
  const combined = new Date(`${dateStr}T${timeStr}:00`);
  if (Number.isNaN(combined.getTime())) throw new Error("Invalid schedule.");
  return combined.toISOString();
}

function isoToLocalDateAndTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${y}-${m}-${day}`, time: `${h}:${min}` };
}

function isNonEmptyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type VarMap = Record<string, { field: string | null }>;
const EMPTY_VARIABLES: Array<{ name: string; default: string; label?: string }> = [];

const initialVarMap = (variableNames: string[]): VarMap =>
  Object.fromEntries(
    variableNames.map((name) => [
      name,
      {
        field: null,
      },
    ]),
  );

const STEP_TITLES = [
  "Choose an email",
  "Choose your audience",
  "Map your variables",
  "When should it go out?",
  "Review and send",
];

export function ComposeModal({
  onClose,
  resumeCampaignId,
  preSelectedEmailId,
}: {
  onClose: () => void;
  resumeCampaignId?: string | null;
  preSelectedEmailId?: string | null;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const resumeId = resumeCampaignId?.trim() ? resumeCampaignId.trim() : null;
  const resumeHydratedId = useRef<string | null>(null);

  const [step, setStep] = useState(1);
  const [emailId, setEmailId] = useState(preSelectedEmailId ?? "");
  const [segmentId, setSegmentId] = useState("");
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [abTest, setAbTest] = useState(false);
  const [fromName, setFromName] = useState("Madoo");
  const [fromEmail, setFromEmail] = useState("");
  const [fromEmailEdited, setFromEmailEdited] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => defaultLocalDate());
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [campaignDraftId, setCampaignDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const [varMap, setVarMap] = useState<VarMap>({});
  const [previewIdx, setPreviewIdx] = useState(0);

  const hydrateWorkspaceId = useWorkspaceStore((s) => s.hydrateWorkspaceId);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  useEffect(() => {
    hydrateWorkspaceId();
  }, [hydrateWorkspaceId]);

  const emailsQuery = useEmails();
  const workspacesQuery = useWorkspaces(true);
  const segmentsQuery = useQuery({
    queryKey: segmentsKeys.list(),
    queryFn: () => segmentsApi.list(),
    staleTime: 60_000,
  });
  const domainsQuery = useQuery({
    queryKey: domainsKeys.list(),
    queryFn: () => domainsApi.list(),
    staleTime: 60_000,
  });
  const resumeQuery = useQuery({
    queryKey: campaignsKeys.detail(resumeId!),
    queryFn: () => campaignsApi.get(resumeId!),
    enabled: Boolean(resumeId),
  });
  const verifiedDomain = useMemo(
    () => (domainsQuery.data ?? []).find((d) => d.status === "verified") ?? null,
    [domainsQuery.data],
  );

  useEffect(() => {
    if (fromEmailEdited) return;
    if (!verifiedDomain) return;
    setFromEmail(`hello@${verifiedDomain.hostname}`);
  }, [verifiedDomain, fromEmailEdited]);

  const previewQuery = useQuery({
    queryKey: segmentsKeys.preview(segmentId),
    queryFn: () => segmentsApi.preview(segmentId),
    enabled: Boolean(segmentId),
    staleTime: 30_000,
  });

  const audCount = previewQuery.data?.count ?? 0;

  useEffect(() => {
    if (resumeId || preSelectedEmailId) return;
    const first = emailsQuery.data?.[0];
    if (!first?.id || emailId) return;
    setEmailId(first.id);
  }, [emailsQuery.data, emailId, resumeId, preSelectedEmailId]);

  useEffect(() => {
    if (resumeId) return;
    const firstId = segmentsQuery.data?.[0]?.id;
    if (!firstId || segmentId) return;
    setSegmentId(firstId);
  }, [segmentsQuery.data, segmentId, resumeId]);

  useEffect(() => {
    resumeHydratedId.current = null;
  }, [resumeId]);

  useEffect(() => {
    if (!resumeId || !resumeQuery.data) return;
    if (resumeHydratedId.current === resumeId) return;
    resumeHydratedId.current = resumeId;
    const row = resumeQuery.data;
    setCampaignDraftId(row.id);
    setEmailId(row.emailId);
    setSegmentId(row.segmentId);
    setFromName(row.fromName);
    setFromEmail(row.fromEmail);
    setFromEmailEdited(true);
    setAbTest(row.abTest);
    if (row.scheduledFor) {
      setSchedule("later");
      const { date, time } = isoToLocalDateAndTime(row.scheduledFor);
      setScheduledDate(date);
      setScheduledTime(time);
    } else {
      setSchedule("now");
    }
    setStep(1);
    setSendError(null);
    setTestSuccess(null);
  }, [resumeId, resumeQuery.data]);

  const selectedEmail = useMemo(
    () => emailsQuery.data?.find((e) => e.id === emailId) ?? emailsQuery.data?.[0] ?? null,
    [emailsQuery.data, emailId],
  );

  const currentVariant =
    selectedEmail && selectedEmail.variants.length > 0
      ? selectedEmail.variants[selectedEmail.variants.length - 1]
      : null;

  const segmentRow = segmentsQuery.data?.find((item) => item.id === segmentId) ?? segmentsQuery.data?.[0];

  function segmentAccent(row: Segment, index: number): string {
    return SEGMENT_ACCENTS[index % SEGMENT_ACCENTS.length]!;
  }

  const variableSpecs = useMemo(
    () => currentVariant?.variableSchema.variables ?? EMPTY_VARIABLES,
    [currentVariant],
  );

  const currentWorkspace = useMemo(() => {
    const rows = workspacesQuery.data ?? [];
    if (rows.length === 0) return null;
    return rows.find((workspace) => workspace.id === activeWorkspaceId) ?? rows[0];
  }, [workspacesQuery.data, activeWorkspaceId]);

  const isPostalAddressMissing = !currentWorkspace?.postalAddress?.trim();
  const postalBlockTooltip = "Add a postal address in workspace settings";

  const emailHeadline = selectedEmail?.title?.trim()?.length
    ? selectedEmail.title!
    : selectedEmail
      ? `${selectedEmail.prompt.slice(0, 72)}${selectedEmail.prompt.length > 72 ? "…" : ""}`
      : "—";

  const previewOptions = PREVIEW_CONTACTS.map((c, i) => ({ value: String(i), label: c.name }));
  const fieldOptions = [
    { value: "", label: "— select field —" },
    ...CSV_FIELDS.map((f) => ({ value: f, label: f })),
  ];

  const matchedCount = useMemo(
    () => variableSpecs.filter((variable) => Boolean(varMap[variable.name]?.field)).length,
    [variableSpecs, varMap],
  );

  useEffect(() => {
    const names = variableSpecs.map((variable) => variable.name);
    setVarMap((prev) => {
      const next = initialVarMap(names);
      for (const name of names) {
        if (prev[name]) next[name] = { field: prev[name].field };
      }
      const prevNames = Object.keys(prev);
      const nextNames = Object.keys(next);
      if (prevNames.length !== nextNames.length) return next;
      for (const name of nextNames) {
        if (!(name in prev)) return next;
        if (prev[name]?.field !== next[name]?.field) return next;
      }
      return prev;
    });
  }, [variableSpecs]);

  const persistDraftCampaign = async (): Promise<void> => {
    if (!segmentId || !emailId || !selectedEmail) throw new Error("Select an email and a segment.");

    let scheduledFor: string | undefined;
    try {
      scheduledFor = scheduleToIso(schedule, scheduledDate, scheduledTime);
    } catch {
      throw new Error("Invalid scheduled date/time.");
    }

    const payload = {
      emailId,
      segmentId,
      fromName: fromName.trim(),
      fromEmail: fromEmail.trim().toLowerCase(),
      abTest,
      ...(scheduledFor ? { scheduledFor } : {}),
    };

    if (!campaignDraftId) {
      const row = await campaignsApi.create(payload);
      setCampaignDraftId(row.id);
      return;
    }
    await campaignsApi.update(campaignDraftId, payload);
  };

  async function advanceFromScheduleStep(): Promise<void> {
    setSendError(null);
    setSavingDraft(true);
    try {
      await persistDraftCampaign();
      setStep(5);
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Unable to save campaign draft.");
      throw e;
    } finally {
      setSavingDraft(false);
    }
  }

  const testMutation = useMutation({
    mutationFn: async (id: string) => campaignsApi.sendTest(id),
    onSuccess: (res) => {
      setSendError(null);
      setTestSuccess(res.messageId ? `Test queued (Resend id: ${res.messageId})` : "Test queued.");
      void queryClient.invalidateQueries({ queryKey: campaignsKeys.list() });
    },
    onError: (error: unknown) => {
      setTestSuccess(null);
      setSendError(error instanceof Error ? error.message : "Test send failed.");
    },
  });

  const queueSendMutation = useMutation({
    mutationFn: async (id: string) => campaignsApi.send(id),
    onSuccess: (_data, campaignId) => {
      setSendError(null);
      void queryClient.invalidateQueries({ queryKey: campaignsKeys.list() });
      void queryClient.invalidateQueries({ queryKey: campaignsKeys.detail(campaignId) });
      void queryClient.invalidateQueries({ queryKey: campaignsKeys.recipients(campaignId) });
      void queryClient.invalidateQueries({ queryKey: auditLogKeys.list() });
      void queryClient.invalidateQueries({
        predicate: (q) =>
          typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("workspaces"),
      });
      onClose();
    },
    onError: (error: unknown) => {
      setSendError(error instanceof Error ? error.message : "Send failed.");
    },
  });

  const advanceBlocked =
    step === 1
      ? !emailId || !currentVariant
      : step === 2
        ? !segmentId || segmentsQuery.isPending
        : step === 3
          ? false
          : step === 4
            ? !fromName.trim() || !isNonEmptyEmail(fromEmail)
            : false;

  const resumeBlocked =
    Boolean(resumeId) && (resumeQuery.isPending || resumeQuery.isError || !resumeQuery.data);

  async function primaryContinue(): Promise<void> {
    if (step >= 5) return;
    if (step === 4) {
      await advanceFromScheduleStep();
      return;
    }
    setStep((s) => s + 1);
  }

  function scheduleLabel(): string {
    if (schedule === "now") return "Sending immediately";
    return `${scheduledDate} · ${scheduledTime} (scheduled)`;
  }

  const footerInner = (
    <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <Button variant="secondary" size="md" onClick={() => (step === 1 ? onClose() : setStep((s) => Math.max(1, s - 1)))}>
        {step === 1 ? "Cancel" : "Back"}
      </Button>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", marginLeft: "auto" }}>
        {step < 5 ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => void primaryContinue()}
            disabled={advanceBlocked || resumeBlocked || (step === 4 && savingDraft)}
            rightIcon={<Icon name="arrow" size={12} />}
          >
            {step === 4 ? (savingDraft ? "Saving…" : "Continue") : "Continue"}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="md"
              disabled={
                !campaignDraftId ||
                resumeBlocked ||
                isPostalAddressMissing ||
                savingDraft ||
                queueSendMutation.isPending ||
                testMutation.isPending
              }
              title={
                !campaignDraftId
                  ? "Finish the previous steps"
                  : isPostalAddressMissing
                    ? postalBlockTooltip
                    : undefined
              }
              onClick={() => campaignDraftId && testMutation.mutate(campaignDraftId)}
            >
              {testMutation.isPending ? "Sending test…" : "Test"}
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Icon name="send" size={12} />}
              disabled={
                !campaignDraftId ||
                resumeBlocked ||
                isPostalAddressMissing ||
                schedule !== "now" ||
                savingDraft ||
                testMutation.isPending ||
                queueSendMutation.isPending
              }
              title={
                schedule !== "now"
                  ? "Scheduled sends stay as drafts until automated delivery is enabled."
                  : isPostalAddressMissing
                    ? postalBlockTooltip
                    : undefined
              }
              onClick={() => campaignDraftId && queueSendMutation.mutate(campaignDraftId)}
            >
              {queueSendMutation.isPending ? "Queueing send…" : "Send now"}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Modal open onClose={onClose} size="lg" eyebrow={`STEP ${step} OF 5`} title={STEP_TITLES[step - 1]} footer={footerInner}>
      <ProgressBar
        value={(step / 5) * 100}
        variant="thin"
        aria-label="Campaign wizard progress"
        style={{ marginBottom: 18 }}
      />

      {(sendError || testSuccess) && (
        <div style={{ marginBottom: 14 }}>
          {sendError ? <Banner tone="danger">{sendError}</Banner> : null}
          {testSuccess && !sendError ? <Banner tone="accent">{testSuccess}</Banner> : null}
        </div>
      )}

      {resumeId ? (
        resumeQuery.isPending ? (
          <Banner tone="info" style={{ marginBottom: 14 }}>
            Loading draft campaign…
          </Banner>
        ) : resumeQuery.isError ? (
          <Banner tone="danger" style={{ marginBottom: 14 }}>
            Unable to load this campaign. Cancel and reopen it from the list.
          </Banner>
        ) : null
      ) : null}

      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              router.push("/");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 14,
              borderRadius: 10,
              border: "1px dashed var(--border)",
              background: "var(--accent-soft)",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              color: "var(--accent-deep)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--accent)",
                color: "var(--accent-fg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="sparkle" size={14} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Generate a new email with AI</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>
                Closes this wizard and jumps to Home to compose.
              </div>
            </div>
            <Icon name="arrow" size={14} />
          </button>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1,
              color: "var(--ink-faint)",
              marginTop: 6,
            }}
          >
            YOUR EMAILS
          </div>
          {emailsQuery.isPending ? <Banner tone="info">Loading emails…</Banner> : null}
          {emailsQuery.isError ? (
            <Banner tone="danger">Unable to load emails. Try refreshing the page.</Banner>
          ) : null}
          {(emailsQuery.data ?? []).map((mail) => {
            const lastVariant = mail.variants.length > 0 ? mail.variants[mail.variants.length - 1] : undefined;
            const selected = mail.id === emailId;
            return (
              <button
                key={mail.id}
                type="button"
                onClick={() => setEmailId(mail.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 10,
                  borderRadius: 10,
                  border: selected ? "1.5px solid var(--ink)" : "1px solid var(--border)",
                  background: selected ? "var(--surface-2)" : "var(--surface)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 92,
                    borderRadius: 6,
                    overflow: "hidden",
                    flexShrink: 0,
                    border: "1px solid var(--border-soft)",
                  }}
                >
                  {lastVariant?.compiledHtml ? (
                    <iframe
                      title=""
                      sandbox="allow-same-origin"
                      srcDoc={lastVariant.compiledHtml}
                      style={{
                        width: 240,
                        height: 320,
                        border: "none",
                        transform: "scale(0.3)",
                        transformOrigin: "top left",
                        pointerEvents: "none",
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 10, color: "var(--ink-faint)", padding: 8 }}>No preview</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>
                    {(mail.title && mail.title.trim()) || `${mail.prompt.slice(0, 72)}${mail.prompt.length > 72 ? "…" : ""}`}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-soft)",
                      marginTop: 4,
                      fontStyle: "italic",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lastVariant?.subject ? `"${lastVariant.subject}"` : "Generate a variant before sending."}
                  </div>
                </div>
                {selected ? (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "var(--ink)",
                      color: "var(--bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  >
                    <Icon name="check" size={11} />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {segmentsQuery.isPending ? <Banner tone="info">Loading segments…</Banner> : null}
          {segmentsQuery.isError ? <Banner tone="danger">Unable to load segments. Try refreshing the page.</Banner> : null}
          {!segmentsQuery.isPending && !segmentsQuery.isError && (segmentsQuery.data ?? []).length === 0 ? (
            <Banner tone="warn">
              No segments yet.{" "}
              <Link href="/segments" prefetch={false} style={{ fontWeight: 600, color: "inherit", textDecoration: "underline" }} onClick={onClose}>
                Create a segment
              </Link>{" "}
              first, then come back to send a campaign.
            </Banner>
          ) : null}
          {(segmentsQuery.data ?? []).map((s, idx) => {
            const accent = segmentAccent(s, idx);
            const selected = segmentId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSegmentId(s.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 10,
                  border: selected ? "1.5px solid var(--ink)" : "1px solid var(--border)",
                  background: selected ? "var(--surface-2)" : "var(--surface)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: accent,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>
                    {selected && previewQuery.isFetching
                      ? "Counting contacts…"
                      : selected && previewQuery.data
                        ? `${previewQuery.data.count.toLocaleString()} contacts`
                        : "Select for live count"}
                  </div>
                </div>
                {selected ? (
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "var(--ink)",
                      color: "var(--bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name="check" size={11} />
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Banner tone="accent">
            <b>
              {matchedCount.toLocaleString()} of {variableSpecs.length.toLocaleString()}
            </b>{" "}
            variables mapped. If a contact misses a mapped field, the component inline default is used.
          </Banner>
          {!currentVariant && (
            <Banner tone="warn">
              No real email variant found yet. Generate an email first to map `variableSchema` values.
            </Banner>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "110px 18px 1fr",
                  gap: 8,
                  padding: "0 4px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-faint)",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                <div>Email variable</div>
                <div></div>
                <div>Contact field</div>
              </div>
              {variableSpecs.map((variable) => {
                const m = varMap[variable.name];
                const isMatched = !!m?.field;
                return (
                  <div
                    key={variable.name}
                    style={{
                      padding: 10,
                      background: "var(--surface-2)",
                      borderRadius: 9,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "110px 18px 1fr",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div
                        className="mono"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "5px 9px",
                          background: "var(--accent-soft)",
                          color: "var(--accent-deep)",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          alignSelf: "flex-start",
                          width: "fit-content",
                        }}
                      >
                        {variable.name}
                      </div>
                      <div
                        style={{
                          color: "var(--ink-faint)",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="arrow" size={12} />
                      </div>
                      <Select
                        selectSize="sm"
                        value={m?.field ?? ""}
                        onChange={(e) =>
                          setVarMap((prev) => ({
                            ...prev,
                            [variable.name]: {
                              ...prev[variable.name],
                              field: e.target.value || null,
                            },
                          }))
                        }
                        options={fieldOptions}
                        aria-label={`Field for ${variable.name}`}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: 11, color: "var(--ink-faint)", fontWeight: 500 }}>
                        Inline default:
                      </span>
                      <Tag tone="neutral" size="sm" sans>
                        {variable.default || "(empty string)"}
                      </Tag>
                      {!isMatched && (
                        <Tag tone="danger" size="sm" sans>
                          not mapped
                        </Tag>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                padding: 12,
                height: "fit-content",
                position: "sticky",
                top: 0,
              }}
            >
              <Select
                label="Preview as"
                selectSize="sm"
                value={String(previewIdx)}
                onChange={(e) => setPreviewIdx(Number(e.target.value))}
                options={previewOptions}
              />
              <div
                style={{
                  background: "var(--surface)",
                  borderRadius: 7,
                  padding: 12,
                  marginTop: 10,
                  border: "1px solid var(--border)",
                  fontSize: 12,
                  lineHeight: 1.6,
                  color: "var(--ink)",
                }}
              >
                {(() => {
                  const c = PREVIEW_CONTACTS[previewIdx];
                  return (
                    <>
                      <div style={{ fontWeight: 600 }}>Preview values for {c.name}</div>
                      <div style={{ marginTop: 6, color: "var(--ink-soft)", display: "flex", flexDirection: "column", gap: 4 }}>
                        {variableSpecs.length === 0 ? (
                          <span>No variables found in current variant.</span>
                        ) : (
                          variableSpecs.slice(0, 6).map((variable) => {
                            const mappedField = varMap[variable.name]?.field;
                            const mappedValue = mappedField
                              ? (c.data as Record<string, string | undefined>)[mappedField]
                              : undefined;
                            const resolved =
                              mappedValue && mappedValue !== "—" ? mappedValue : variable.default;
                            return (
                              <div key={variable.name}>
                                <span className="mono">{variable.name}</span>: {resolved || "(empty string)"}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--ink-faint)",
                  marginTop: 8,
                  lineHeight: 1.4,
                  fontStyle: "italic",
                }}
              >
                Switch contacts to see how the email renders for different recipients.
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="From name" value={fromName} onChange={(e) => setFromName(e.target.value)} />
          <Input
            label="From email"
            type="email"
            value={fromEmail}
            onChange={(e) => {
              setFromEmail(e.target.value);
              setFromEmailEdited(true);
            }}
            placeholder={
              verifiedDomain
                ? `hello@${verifiedDomain.hostname}`
                : "noreply@your-verified-domain.com"
            }
            hint={
              verifiedDomain
                ? `Must use a verified domain. Verified: ${verifiedDomain.hostname}`
                : "No verified domain yet. Verify one in Domains before sending."
            }
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <SelectableCard
              padded
              selected={schedule === "now"}
              onClick={() => setSchedule("now")}
              title="Send now"
              description={`Goes out immediately to ${audCount.toLocaleString()} contacts`}
            />
            <SelectableCard
              padded
              selected={schedule === "later"}
              onClick={() => setSchedule("later")}
              title="Schedule for later"
              description="Saved on the draft; cron delivery arrives in a later phase."
            />
          </div>
          {schedule === "later" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                padding: 14,
                background: "var(--surface-2)",
                borderRadius: 10,
              }}
            >
              <Input
                label="Date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <Input
                label="Time"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          )}
          <Banner tone="accent">
            <Checkbox
              checked={abTest}
              onChange={(e) => setAbTest(e.target.checked)}
              label="Run A/B test on subject lines"
              description="Stored on the campaign; automated rollout is not wired yet."
            />
          </Banner>
        </div>
      )}

      {step === 5 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isPostalAddressMissing ? (
            <Banner tone="warn">
              Add your postal address for CAN-SPAM before testing or sending to your list.&nbsp;
              <Link
                href="/settings"
                prefetch={false}
                style={{ fontWeight: 600, color: "inherit", textDecoration: "underline" }}
              >
                Open workspace settings
              </Link>
            </Banner>
          ) : null}
          <div
            style={{
              display: "flex",
              gap: 12,
              padding: 12,
              background: "var(--surface-2)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 60,
                height: 76,
                borderRadius: 6,
                overflow: "hidden",
                flexShrink: 0,
                border: "1px solid var(--border-soft)",
              }}
            >
              {currentVariant?.compiledHtml ? (
                <iframe
                  title=""
                  sandbox="allow-same-origin"
                  srcDoc={currentVariant.compiledHtml}
                  style={{
                    width: 240,
                    height: 300,
                    border: "none",
                    transform: "scale(0.28)",
                    transformOrigin: "top left",
                    pointerEvents: "none",
                  }}
                />
              ) : (
                <div style={{ fontSize: 10, padding: 6, color: "var(--ink-faint)" }}>No preview</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                Sending
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginTop: 2 }}>{emailHeadline}</div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-soft)",
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                &quot;{currentVariant?.subject ?? "—"}&quot;
              </div>
            </div>
          </div>

          {(
            [
              ["Email", emailHeadline],
              ["Subject", currentVariant?.subject ?? "—"],
              ["Audience", `${segmentRow?.name ?? "—"} (${audCount.toLocaleString()} contacts)`],
              ["Schedule", scheduleLabel()],
              ["A/B test", abTest ? "Flagged — routing later" : "No"],
              ["From", `${fromName.trim()} <${fromEmail.trim().toLowerCase()}>`],
            ] as const
          ).map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid var(--border-soft)",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--ink-faint)", fontWeight: 500 }}>{k}</div>
              <div style={{ fontSize: 13.5, color: "var(--ink)" }}>{v}</div>
            </div>
          ))}

          <Banner tone="accent" title="Send note" style={{ marginTop: 8 }}>
            Test emails your inbox using the authenticated account. Send now queues the Phase 3 batch worker for active
            contacts (suppressed recipients are skipped automatically).
          </Banner>
        </div>
      )}
    </Modal>
  );
}
