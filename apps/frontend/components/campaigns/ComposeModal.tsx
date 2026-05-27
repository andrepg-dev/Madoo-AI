"use client";

import { auditLogKeys } from "@/actions/audit-log";
import { campaignsApi, campaignsKeys } from "@/actions/campaigns";
import { contactsApi, contactsKeys } from "@/actions/contacts";
import { domainsApi, domainsKeys } from "@/actions/domains";
import { segmentsApi, segmentsKeys } from "@/actions/segments";
import { useEmails } from "@/hooks/use-emails";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { useWorkspaceStore } from "@/stores/workspace";
import type { CampaignVariableMapping, Contact } from "@madoo/shared";
import {
  Banner,
  Button,
  Checkbox,
  Icon,
  Input,
  Modal,
  ProgressBar,
  Select,
  SelectableCard,
  Tag,
} from "@madoo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const SEGMENT_ACCENTS = ["#1F1A12", "#2F5C42", "#A87E54", "#A23E2F", "#5B5FCB"] as const;
const ALL_CONTACTS_ID = "__all__";

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

function isAllContactsSegmentName(name: string): boolean {
  return name.trim().toLowerCase() === "all contacts";
}

function contactDisplayName(contact: Contact, index: number): string {
  const name = `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim();
  if (name) return name;
  return contact.email?.trim() || `Contact ${index + 1}`;
}

type VarMap = Record<string, { field: string | null }>;
const EMPTY_VARIABLES: Array<{
  name: string;
  default: string;
  label?: string;
  scope: "dynamic" | "static";
}> = [];

const BASE_CONTACT_FIELD_OPTIONS = [
  { value: "contact.email", label: "Email" },
  { value: "contact.firstName", label: "First name" },
  { value: "contact.lastName", label: "Last name" },
];

const initialVarMap = (variableNames: string[]): VarMap =>
  Object.fromEntries(
    variableNames.map((name) => [
      name,
      {
        field: null,
      },
    ]),
  );

const varMapToVariableMapping = (varMap: VarMap): CampaignVariableMapping =>
  Object.fromEntries(
    Object.entries(varMap)
      .map(([name, mapping]) => [name, mapping.field?.trim() ?? ""] as const)
      .filter(([, field]) => field.length > 0),
  );

const variableMappingToVarMap = (variableMapping: CampaignVariableMapping): VarMap =>
  Object.fromEntries(
    Object.entries(variableMapping).map(([name, field]) => [
      name,
      {
        field,
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
  const [segmentId, setSegmentId] = useState(ALL_CONTACTS_ID);
  const [schedule, setSchedule] = useState<"now" | "later">("now");
  const [abTest, setAbTest] = useState(false);
  const [fromName, setFromName] = useState("Madoo");
  const [fromEmailPrefix, setFromEmailPrefix] = useState("noreply");
  const [fromEmailDomain, setFromEmailDomain] = useState("madooai.com");
  const [scheduledDate, setScheduledDate] = useState(() => defaultLocalDate());
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [campaignDraftId, setCampaignDraftId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  const [varMap, setVarMap] = useState<VarMap>({});

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
  const savedAllContactsSegment = useMemo(
    () => (segmentsQuery.data ?? []).find((segment) => isAllContactsSegmentName(segment.name)) ?? null,
    [segmentsQuery.data],
  );
  const visibleSegments = useMemo(
    () =>
      (segmentsQuery.data ?? []).filter(
        (segment) => !isAllContactsSegmentName(segment.name),
      ),
    [segmentsQuery.data],
  );
  const resumeQuery = useQuery({
    queryKey: campaignsKeys.detail(resumeId!),
    queryFn: () => campaignsApi.get(resumeId!),
    enabled: Boolean(resumeId),
  });
  const verifiedDomain = useMemo(
    () => (domainsQuery.data ?? []).find((d) => d.status === "verified") ?? null,
    [domainsQuery.data],
  );

  const domainOptions = useMemo(() => {
    const opts: Array<{ label: string; value: string }> = [{ label: "madooai.com", value: "madooai.com" }];
    if (verifiedDomain) opts.push({ label: verifiedDomain.hostname, value: verifiedDomain.hostname });
    return opts;
  }, [verifiedDomain]);

  const fromEmail = `${fromEmailPrefix}@${fromEmailDomain}`;
  const isSavedAllContactsSelected =
    Boolean(savedAllContactsSegment) && segmentId === savedAllContactsSegment?.id;
  const isAllContacts = segmentId === ALL_CONTACTS_ID || isSavedAllContactsSelected;

  const previewQuery = useQuery({
    queryKey: segmentsKeys.preview(segmentId),
    queryFn: () => segmentsApi.preview(segmentId),
    enabled: Boolean(segmentId) && !isAllContacts,
    staleTime: 30_000,
  });

  const audCount = previewQuery.data?.count ?? 0;
  const audienceContactsInput = useMemo(
    () => ({
      ...(isAllContacts ? {} : { segmentId }),
      pageSize: 5,
    }),
    [isAllContacts, segmentId],
  );
  const audienceContactsQuery = useQuery({
    queryKey: contactsKeys.list(audienceContactsInput),
    queryFn: () => contactsApi.list(audienceContactsInput),
    enabled: step === 2 && Boolean(segmentId),
    staleTime: 30_000,
  });
  const audienceContacts = audienceContactsQuery.data?.items ?? [];
  const audienceCount = audienceContactsQuery.data?.total ?? (isAllContacts ? 0 : audCount);
  const audienceCountLoaded = Boolean(audienceContactsQuery.data);

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
    const [resumePrefix = "noreply", resumeDomain = "madooai.com"] = row.fromEmail.split("@");
    setFromEmailPrefix(resumePrefix);
    setFromEmailDomain(resumeDomain);
    setAbTest(row.abTest);
    setVarMap(variableMappingToVarMap(row.variableMapping));
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

  const segmentRow = isAllContacts
    ? null
    : segmentsQuery.data?.find((item) => item.id === segmentId) ?? visibleSegments[0] ?? null;


  const variableSpecs = useMemo(
    () =>
      (currentVariant?.variableSchema.variables ?? EMPTY_VARIABLES).filter(
        (variable) => (variable.scope ?? "dynamic") === "dynamic",
      ),
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

  const sampleContacts = isAllContacts ? [] : previewQuery.data?.sampleContacts ?? [];

  const fieldOptions = useMemo(() => {
    const customFieldSet = new Set<string>();
    for (const contact of sampleContacts) {
      for (const key of Object.keys(contact.customFields ?? {})) customFieldSet.add(key);
    }
    const customFieldOptions = Array.from(customFieldSet)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => ({
        value: `custom.${key}`,
        label: key,
      }));
    return [
      { value: "", label: "Select a contact field" },
      ...BASE_CONTACT_FIELD_OPTIONS,
      ...customFieldOptions,
    ];
  }, [sampleContacts]);

  const matchedCount = useMemo(
    () => variableSpecs.filter((variable) => Boolean(varMap[variable.name]?.field)).length,
    [variableSpecs, varMap],
  );
  const hasDynamicVariables = variableSpecs.length > 0;

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

  useEffect(() => {
    if (step === 3 && !hasDynamicVariables) setStep(4);
  }, [hasDynamicVariables, step]);

  const persistDraftCampaign = async (): Promise<void> => {
    if (!segmentId || !emailId || !selectedEmail) throw new Error("Select an email and a segment.");

    let resolvedSegmentId = segmentId;
    if (isAllContacts) {
      if (savedAllContactsSegment) {
        resolvedSegmentId = savedAllContactsSegment.id;
      } else {
        const created = await segmentsApi.create({ name: "All contacts", query: {} });
        resolvedSegmentId = created.id;
        void queryClient.invalidateQueries({ queryKey: segmentsKeys.list() });
      }
    }

    let scheduledFor: string | undefined;
    try {
      scheduledFor = scheduleToIso(schedule, scheduledDate, scheduledTime);
    } catch {
      throw new Error("Invalid scheduled date/time.");
    }

    const payload = {
      emailId,
      segmentId: resolvedSegmentId,
      fromName: fromName.trim(),
      fromEmail: fromEmail.trim().toLowerCase(),
      abTest,
      variableMapping: varMapToVariableMapping(varMap),
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
        ? !segmentId || segmentsQuery.isPending || audienceContactsQuery.isPending || (audienceCountLoaded && audienceCount === 0)
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
    setStep((s) => (s === 2 && !hasDynamicVariables ? 4 : s + 1));
  }

  function scheduleLabel(): string {
    if (schedule === "now") return "Sending immediately";
    return `${scheduledDate} · ${scheduledTime} (scheduled)`;
  }

  const footerInner = (
    <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <Button
        variant="secondary"
        size="md"
        onClick={() =>
          step === 1
            ? onClose()
            : setStep((s) => (s === 4 && !hasDynamicVariables ? 2 : Math.max(1, s - 1)))
        }
      >
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
        ) : schedule === "later" ? (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Icon name="send" size={12} />}
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: campaignsKeys.list() });
              void queryClient.invalidateQueries({
                predicate: (q) =>
                  typeof q.queryKey[0] === "string" && (q.queryKey[0] as string).startsWith("workspaces"),
              });
              onClose();
            }}
          >
            Done — scheduled
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
                savingDraft ||
                testMutation.isPending ||
                queueSendMutation.isPending
              }
              title={
                isPostalAddressMissing ? postalBlockTooltip : undefined
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
                  {lastVariant?.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lastVariant.previewUrl}
                      alt={mail.title?.trim() || "Email preview"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "top",
                      }}
                    />
                  ) : lastVariant?.compiledHtml ? (
                    <div style={{ width: "100%", height: "100%", overflow: "hidden", background: "#fff" }}>
                      <iframe
                        title={mail.title?.trim() || "Email preview"}
                        srcDoc={lastVariant.compiledHtml}
                        sandbox="allow-same-origin"
                        scrolling="no"
                        style={{
                          width: "100%",
                          height: "100%",
                          border: "none",
                          pointerEvents: "none",
                        }}
                      />
                    </div>
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
          {/* All contacts virtual entry */}
          {[
            { id: ALL_CONTACTS_ID, name: "All contacts", accent: "var(--accent)" },
            ...visibleSegments.map((s, idx) => ({
              id: s.id,
              name: s.name,
              accent: SEGMENT_ACCENTS[idx % SEGMENT_ACCENTS.length]!,
            })),
          ].map((s) => {
            const selected = s.id === ALL_CONTACTS_ID ? isAllContacts : segmentId === s.id;
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
                    background: s.accent,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}>
                    {s.id === ALL_CONTACTS_ID
                      ? "Every active contact in your workspace"
                      : selected && previewQuery.isFetching
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
          {audienceContactsQuery.isPending && segmentId ? (
            <Banner tone="info">Loading audience preview…</Banner>
          ) : audienceCountLoaded && audienceCount === 0 ? (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "var(--surface-2)",
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "var(--accent-soft)",
                  color: "var(--accent-deep)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name="inbox" size={15} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  Add contacts before sending
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.4 }}>
                  This audience has no contacts yet. Import or create contacts, then come back to send.
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  router.push("/contacts");
                }}
              >
                Add contacts
              </Button>
            </div>
          ) : audienceContacts.length > 0 ? (
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "var(--surface-2)",
                padding: 14,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                    Audience preview
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 3 }}>
                    {audienceCount.toLocaleString()} contacts will receive this email.
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    router.push("/contacts");
                  }}
                >
                  Manage
                </Button>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {audienceContacts.map((contact, index) => (
                  <div
                    key={contact.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "7px 8px",
                      border: "1px solid var(--border-soft)",
                      borderRadius: 8,
                      background: "var(--surface)",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "var(--accent-soft)",
                        color: "var(--accent-deep)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {contactDisplayName(contact, index).charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 650,
                          color: "var(--ink)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {contactDisplayName(contact, index)}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--ink-faint)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {contact.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {!currentVariant && (
            <Banner tone="warn">
              No real email variant found yet. Generate an email first to map `variableSchema` values.
            </Banner>
          )}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 10,
              background: "var(--surface-2)",
              padding: 14,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
              Match template variables to contact fields
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.45, marginTop: 4 }}>
              {matchedCount.toLocaleString()} of {variableSpecs.length.toLocaleString()} mapped. Unmapped fields use the template default.
            </div>
          </div>
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
              <div>Template variable</div>
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
        </div>
      )}

      {step === 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="From name" value={fromName} onChange={(e) => setFromName(e.target.value)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-soft)" }}>
              From email
            </label>
            <div style={{ display: "flex", alignItems: "stretch", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", background: "var(--surface)" }}>
              <input
                type="text"
                value={fromEmailPrefix}
                onChange={(e) => setFromEmailPrefix(e.target.value.replace(/[@\s]/g, ""))}
                placeholder="noreply"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: "none",
                  outline: "none",
                  padding: "10px 12px",
                  background: "transparent",
                  fontSize: 14,
                  color: "var(--ink)",
                }}
              />
              <div style={{ display: "flex", alignItems: "center", padding: "0 4px 0 0", gap: 0, borderLeft: "1px solid var(--border)", background: "var(--surface-subtle, var(--surface))" }}>
                <span style={{ padding: "0 6px", color: "var(--ink-soft)", fontSize: 14, userSelect: "none" }}>@</span>
                <Select
                  selectSize="sm"
                  value={fromEmailDomain}
                  onChange={(e) => setFromEmailDomain(e.target.value)}
                  options={domainOptions}
                  aria-label="From email domain"
                />
              </div>
            </div>
            {!verifiedDomain && (
              <div style={{ marginTop: 4, fontSize: 12, color: "var(--ink-soft)" }}>
                Want to send from your own domain?{" "}
                <Link href="/domain" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                  Set up a custom domain
                </Link>
              </div>
            )}
          </div>
          <div className="madoo-grid-two" style={{ gap: 10 }}>
            <SelectableCard
              padded
              selected={schedule === "now"}
              onClick={() => setSchedule("now")}
              title="Send now"
              description={`Goes out immediately to ${audienceCount.toLocaleString()} contacts`}
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
                min={defaultLocalDate()}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
              <Input
                label="Time"
                type="time"
                value={scheduledTime}
                min={scheduledDate === defaultLocalDate() ? new Date().toTimeString().slice(0, 5) : undefined}
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
              {currentVariant?.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentVariant.previewUrl}
                  alt={emailHeadline}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "top",
                  }}
                />
              ) : currentVariant?.compiledHtml ? (
                <div style={{ width: "100%", height: "100%", overflow: "hidden", background: "#fff" }}>
                  <iframe
                    title={emailHeadline}
                    srcDoc={currentVariant.compiledHtml}
                    sandbox="allow-same-origin"
                    scrolling="no"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      pointerEvents: "none",
                    }}
                  />
                </div>
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
              [
                "Audience",
                isAllContacts
                  ? `All contacts (${audienceCount.toLocaleString()} contacts)`
                  : `${segmentRow?.name ?? "—"} (${audienceCount.toLocaleString()} contacts)`,
              ],
              ["Schedule", scheduleLabel()],
              ["A/B test", abTest ? "Flagged — routing later" : "No"],
              ["From", `${fromName.trim()} <${fromEmail.trim().toLowerCase()}>`],
            ] as const
          ).map(([k, v]) => (
            <div
              key={k}
              className="madoo-grid-label"
              style={{
                gridTemplateColumns: "120px 1fr",
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
