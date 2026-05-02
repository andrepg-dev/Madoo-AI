"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import {
  Badge,
  Button,
  Checkbox,
  Icon,
  IconButton,
  Input,
  Modal,
  Tag,
  type BadgeTone,
} from "@madoo/ui";
import { ApiError } from "@/lib/api/fetch-wrapper";
import { contactsApi, contactsKeys, type CreateContactInput } from "@/actions/contacts";
import { segmentsApi, segmentsKeys } from "@/actions/segments";
import { tagsApi, tagsKeys } from "@/actions/tags";

type ContactStatus = "active" | "unsubscribed" | "bounced" | "complained";
type ImportStep = "drop" | "mapping" | "processing";
type LocalCsvPreview = { rows: Record<string, string>[]; columns: string[] };

const STATUS_TONE: Record<ContactStatus, BadgeTone> = {
  active: "success",
  unsubscribed: "neutral",
  bounced: "danger",
  complained: "danger",
};

export function ContactsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeSegmentId, setActiveSegmentId] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSegmentModalOpen, setIsSegmentModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [newContact, setNewContact] = useState<{
    email: string;
    firstName: string;
    lastName: string;
  }>({ email: "", firstName: "", lastName: "" });
  const [dragOver, setDragOver] = useState(false);
  const [importStep, setImportStep] = useState<ImportStep>("drop");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<LocalCsvPreview | null>(null);
  const [columnMapping, setColumnMapping] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });
  const [segmentPrompt, setSegmentPrompt] = useState("");
  const [segmentName, setSegmentName] = useState("");
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | ContactStatus>("all");
  const [tagPresenceFilter, setTagPresenceFilter] = useState<"all" | "tagged" | "untagged">("all");

  const segmentsQuery = useQuery({
    queryKey: segmentsKeys.list(),
    queryFn: () => segmentsApi.list(),
  });

  const contactsQuery = useQuery({
    queryKey: contactsKeys.list({
      segmentId: activeSegmentId,
      search: search || undefined,
      page: 1,
      pageSize: 100,
    }),
    queryFn: () =>
      contactsApi.list({
        segmentId: activeSegmentId,
        search: search || undefined,
        page: 1,
        pageSize: 100,
      }),
  });

  const tagsQuery = useQuery({
    queryKey: tagsKeys.list(),
    queryFn: () => tagsApi.list(),
  });

  const importJobQuery = useQuery({
    queryKey: contactsKeys.importJob(importJobId ?? ""),
    queryFn: () => contactsApi.getImportJob(importJobId ?? ""),
    enabled: Boolean(importJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 1500;
      return status === "COMPLETED" || status === "FAILED" ? false : 1500;
    },
  });

  const uploadImportMutation = useMutation({
    mutationFn: (file: File) => contactsApi.uploadCsv(file),
    onSuccess: (result) => {
      setImportJobId(result.jobId);
      setColumnMapping({
        email: pickDetectedColumn(result.detectedColumns, ["email", "e-mail"]),
        firstName: pickDetectedColumn(result.detectedColumns, ["first_name", "firstname", "name"]),
        lastName: pickDetectedColumn(result.detectedColumns, ["last_name", "lastname", "surname"]),
      });
      setImportStep("mapping");
    },
  });

  const confirmImportMutation = useMutation({
    mutationFn: () => {
      if (!importJobId) throw new Error("Missing import job id.");
      return contactsApi.confirmImport(importJobId, {
        columnMapping: {
          email: columnMapping.email,
          firstName: columnMapping.firstName || undefined,
          lastName: columnMapping.lastName || undefined,
        },
      });
    },
    onSuccess: () => {
      setImportStep("processing");
    },
  });

  const segmentPreviewMutation = useMutation({
    mutationFn: () => segmentsApi.fromPrompt({ prompt: segmentPrompt }),
    onSuccess: (preview) => {
      if (!segmentName.trim()) {
        setSegmentName(preview.name ?? "New segment");
      }
    },
  });

  const createContactMutation = useMutation({
    mutationFn: (input: CreateContactInput) => contactsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      setIsAddContactModalOpen(false);
      setNewContact({ email: "", firstName: "", lastName: "" });
    },
  });

  const saveSegmentMutation = useMutation({
    mutationFn: () => {
      const preview = segmentPreviewMutation.data;
      if (!preview) throw new Error("Generate a segment preview first.");
      return segmentsApi.create({
        name: segmentName.trim() || preview.name || "New segment",
        query: preview.query,
      });
    },
    onSuccess: (segment) => {
      queryClient.invalidateQueries({ queryKey: segmentsKeys.list() });
      setActiveSegmentId(segment.id);
      setIsSegmentModalOpen(false);
      setSegmentPrompt("");
      setSegmentName("");
      segmentPreviewMutation.reset();
    },
  });

  const createTagMutation = useMutation({
    mutationFn: (name: string) => tagsApi.create({ name }),
    onSuccess: (tag) => {
      queryClient.invalidateQueries({ queryKey: tagsKeys.list() });
      setSelectedTagIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
      setNewTagName("");
    },
  });

  const assignTagsMutation = useMutation({
    mutationFn: async (payload: { contactIds: string[]; tagIds: string[] }) => {
      if (payload.contactIds.length === 0 || payload.tagIds.length === 0) return;
      const contactsById = new Map((contactsQuery.data?.items ?? []).map((contact) => [contact.id, contact]));
      await Promise.all(
        payload.contactIds.map(async (contactId) => {
          const contact = contactsById.get(contactId);
          const existingTagIds = contact?.tags?.map((tag) => tag.id) ?? [];
          const mergedTagIds = [...new Set([...existingTagIds, ...payload.tagIds])];
          await contactsApi.assignTags(contactId, mergedTagIds);
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactsKeys.all });
      setIsTagModalOpen(false);
      setSelectedTagIds([]);
      setNewTagName("");
    },
  });

  const segments = useMemo(
    () => [
      {
        id: "",
        name: "All contacts",
        accent: "var(--accent)",
      },
      ...(segmentsQuery.data ?? []).map((segment, idx) => ({
        id: segment.id,
        name: segment.name,
        accent: idx % 2 === 0 ? "var(--accent)" : "var(--accent-deep)",
      })),
    ],
    [segmentsQuery.data],
  );

  const activeSegment = segments.find((segment) => segment.id === (activeSegmentId ?? "")) ?? segments[0];
  const contacts = contactsQuery.data?.items ?? [];
  const filtered = contacts.filter((contact) => {
    if (statusFilter !== "all" && contact.status !== statusFilter) return false;
    if (tagPresenceFilter === "tagged" && contact.tags.length === 0) return false;
    if (tagPresenceFilter === "untagged" && contact.tags.length > 0) return false;
    return true;
  });

  const rows = filtered.map((contact) => ({
    id: contact.id,
    name: `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || contact.email.split("@")[0],
    email: contact.email,
    tags: contact.tags.map((tag) => tag.name),
    joined: new Date(contact.createdAt).toLocaleDateString(),
    opens: Number.parseInt(contact.customFields.opens ?? "0", 10) || 0,
    status: contact.status as ContactStatus,
  }));

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((contact) => contact.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const onDropFile = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    loadCsvPreview(file);
  };

  const loadCsvPreview = (file: File) => {
    setImportFile(file);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const columns = result.meta.fields ?? [];
        const rows = result.data.slice(0, 10);
        setLocalPreview({ columns, rows });
      },
    });
  };

  const startImport = () => {
    if (!importFile) return;
    uploadImportMutation.mutate(importFile);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportStep("drop");
    setImportFile(null);
    setImportJobId(null);
    setLocalPreview(null);
    setColumnMapping({ email: "", firstName: "", lastName: "" });
    uploadImportMutation.reset();
    confirmImportMutation.reset();
  };

  const importDone = importJobQuery.data?.status === "COMPLETED";
  useEffect(() => {
    if (!importDone) return;
    queryClient.invalidateQueries({ queryKey: contactsKeys.all });
  }, [importDone, queryClient]);

  const emptyState = !contactsQuery.isLoading && !contactsQuery.isError && rows.length === 0;
  const importErrors = importJobQuery.data?.errors ?? [];
  const segmentPreview = segmentPreviewMutation.data;
  const availableTags = tagsQuery.data ?? [];
  const hasActiveFilters = statusFilter !== "all" || tagPresenceFilter !== "all";

  const openCampaignComposer = () => {
    const params = new URLSearchParams();
    params.set("compose", "1");
    if (activeSegmentId) params.set("segmentId", activeSegmentId);
    params.set("selectedCount", String(selected.size));
    router.push(`/campaigns?${params.toString()}`);
  };

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <aside
        style={{
          width: 240,
          borderRight: "1px solid var(--border)",
          padding: "20px 14px",
          background: "var(--surface)",
          flexShrink: 0,
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 8px 12px",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--ink-faint)" }}>
            SEGMENTS
          </div>
          <IconButton
            variant="soft"
            size="sm"
            aria-label="New segment"
            onClick={() => setIsSegmentModalOpen(true)}
          >
            <Icon name="plus" size={12} />
          </IconButton>
        </div>
        {segments.map((segment) => {
          const active = (activeSegmentId ?? "") === segment.id;
          return (
            <button
              key={segment.id || "all-contacts"}
              type="button"
              onClick={() => setActiveSegmentId(segment.id || undefined)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "8px 10px",
                borderRadius: 7,
                border: "none",
                background: active ? "var(--surface-2)" : "transparent",
                color: active ? "var(--ink)" : "var(--ink-soft)",
                fontSize: 13,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                fontWeight: active ? 600 : 500,
              }}
            >
              <div
                style={{ width: 8, height: 8, borderRadius: 2, background: segment.accent, flexShrink: 0 }}
              />
              <span
                style={{
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {segment.name}
              </span>
            </button>
          );
        })}
        <div
          style={{
            marginTop: 24,
            padding: 12,
            background: "var(--accent-soft)",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent-deep)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="sparkle" size={12} /> Smart segment
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: "var(--accent-deep)",
              opacity: 0.85,
              marginTop: 4,
              lineHeight: 1.45,
            }}
          >
            Describe a group in plain words and AI builds the filter.
          </div>
          <Button variant="accent" size="sm" style={{ marginTop: 8 }} onClick={() => setIsSegmentModalOpen(true)}>
            Try it →
          </Button>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            padding: "24px 32px 16px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <h1 className="serif" style={{ fontSize: 30, fontWeight: 400, margin: 0, letterSpacing: -0.4 }}>
                {activeSegment?.name ?? "All contacts"}
              </h1>
              <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
                {(contactsQuery.data?.total ?? 0).toLocaleString()} contacts
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="md" onClick={() => setIsImportModalOpen(true)}>
                Import CSV
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Icon name="plus" size={12} />}
                onClick={() => setIsAddContactModalOpen(true)}
              >
                Add contact
              </Button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
            <div style={{ flex: 1, maxWidth: 320 }}>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts…"
                variant="filled"
                inputSize="sm"
                startAdornment={<Icon name="search" size={13} />}
                aria-label="Search contacts"
              />
            </div>
            <Button
              variant={hasActiveFilters ? "primary" : "secondary"}
              size="sm"
              leftIcon={<Icon name="sliders" size={12} />}
              onClick={() => setIsFilterModalOpen(true)}
            >
              Filter
            </Button>
            {selected.size > 0 && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12.5,
                  color: "var(--ink-soft)",
                }}
              >
                <span>{selected.size} selected</span>
                <Button variant="secondary" size="sm" onClick={() => setIsTagModalOpen(true)}>
                  Add tag
                </Button>
                <Button variant="primary" size="sm" onClick={openCampaignComposer}>
                  Send campaign →
                </Button>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {emptyState ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 10,
                color: "var(--ink-soft)",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>No contacts yet</div>
              <div style={{ fontSize: 13 }}>Import a CSV file to start building your audience.</div>
              <Button variant="primary" size="sm" onClick={() => setIsImportModalOpen(true)}>
                Import CSV
              </Button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border)",
                    position: "sticky",
                    top: 0,
                    background: "var(--surface)",
                    zIndex: 1,
                  }}
                >
                  <th style={{ padding: "10px 16px 10px 32px", textAlign: "left", width: 30 }}>
                    <Checkbox
                      checked={selected.size === rows.length && rows.length > 0}
                      onChange={toggleAll}
                      aria-label="Select all contacts"
                    />
                  </th>
                  {["Name", "Tags", "Joined", "Engagement", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--ink-faint)",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((contact) => (
                  <tr
                    key={contact.id}
                    style={{
                      borderBottom: "1px solid var(--border-soft)",
                      background: selected.has(contact.id) ? "var(--accent-soft)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "12px 16px 12px 32px" }}>
                      <Checkbox
                        checked={selected.has(contact.id)}
                        onChange={() => toggleOne(contact.id)}
                        aria-label={`Select ${contact.name}`}
                      />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500, color: "var(--ink)" }}>{contact.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{contact.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {contact.tags.length === 0 ? (
                          <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>-</span>
                        ) : (
                          contact.tags.map((tag) => (
                            <Tag key={`${contact.id}-${tag}`} tone="neutral" size="sm" sans>
                              {tag}
                            </Tag>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--ink-soft)" }}>
                      {contact.joined}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 60,
                            height: 4,
                            background: "var(--border)",
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, contact.opens * 1.5)}%`,
                              height: "100%",
                              background:
                                contact.opens > 30
                                  ? "var(--accent)"
                                  : contact.opens > 10
                                    ? "#D6B98A"
                                    : "#C4B5A0",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: 11.5,
                            color: "var(--ink-faint)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {contact.opens} opens
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Badge tone={STATUS_TONE[contact.status]} dot>
                        {contact.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={isImportModalOpen}
        onClose={closeImportModal}
        size="lg"
        title="Import contacts from CSV"
        description="Upload your CSV, map columns, then start import."
      >
        {importStep === "drop" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDropFile}
              style={{
                border: `1px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 10,
                padding: "30px 20px",
                textAlign: "center",
                background: dragOver ? "var(--accent-soft)" : "var(--surface)",
              }}
            >
              <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                Drag and drop a CSV file here, or choose one manually.
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) loadCsvPreview(file);
                }}
                style={{ marginTop: 12 }}
              />
            </div>
            {localPreview && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)" }}>
                      {localPreview.columns.map((column) => (
                        <th key={column} style={{ padding: 8, textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {localPreview.rows.slice(0, 5).map((row, idx) => (
                      <tr key={`${idx}-${row.email ?? "row"}`}>
                        {localPreview.columns.map((column) => (
                          <td key={`${idx}-${column}`} style={{ padding: 8, borderBottom: "1px solid var(--border-soft)" }}>
                            {row[column] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={closeImportModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={startImport}
                disabled={!importFile || uploadImportMutation.isPending}
              >
                {uploadImportMutation.isPending ? "Uploading..." : "Continue"}
              </Button>
            </div>
          </div>
        )}

        {importStep === "mapping" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              Email column *
              <select
                value={columnMapping.email}
                onChange={(event) => setColumnMapping((prev) => ({ ...prev, email: event.target.value }))}
                style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <option value="">Select column</option>
                {(localPreview?.columns ?? []).map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              First name column
              <select
                value={columnMapping.firstName}
                onChange={(event) => setColumnMapping((prev) => ({ ...prev, firstName: event.target.value }))}
                style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <option value="">Skip</option>
                {(localPreview?.columns ?? []).map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              Last name column
              <select
                value={columnMapping.lastName}
                onChange={(event) => setColumnMapping((prev) => ({ ...prev, lastName: event.target.value }))}
                style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}
              >
                <option value="">Skip</option>
                {(localPreview?.columns ?? []).map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={closeImportModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => confirmImportMutation.mutate()}
                disabled={!columnMapping.email || confirmImportMutation.isPending}
              >
                {confirmImportMutation.isPending ? "Confirming..." : "Confirm import"}
              </Button>
            </div>
          </div>
        )}

        {importStep === "processing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              {importJobQuery.data
                ? `Status: ${importJobQuery.data.status} · ${importJobQuery.data.processedRows}/${importJobQuery.data.totalRows} rows`
                : "Polling import status..."}
            </div>
            {importErrors.length > 0 && (
              <div style={{ maxHeight: 140, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: 8 }}>
                {importErrors.slice(0, 8).map((error, idx) => (
                  <div key={`${idx}-${error.row}`} style={{ fontSize: 12, color: "var(--ink-soft)", marginBottom: 6 }}>
                    Row {error.row}: {error.reason}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={closeImportModal}>
                {importDone ? "Close" : "Background this"}
              </Button>
            </div>
          </div>
        )}

        {(uploadImportMutation.error || confirmImportMutation.error) && (
          <div style={{ marginTop: 10, color: "#b04c2e", fontSize: 12 }}>
            {toErrorMessage(uploadImportMutation.error ?? confirmImportMutation.error)}
          </div>
        )}
      </Modal>

      <Modal
        open={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        size="sm"
        title="Filters"
        description="Refine contacts shown in this table."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | ContactStatus)}
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
              <option value="complained">Complained</option>
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            Tags
            <select
              value={tagPresenceFilter}
              onChange={(event) =>
                setTagPresenceFilter(event.target.value as "all" | "tagged" | "untagged")
              }
              style={{ padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <option value="all">All contacts</option>
              <option value="tagged">Only tagged</option>
              <option value="untagged">Only untagged</option>
            </select>
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setTagPresenceFilter("all");
              }}
            >
              Clear
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsFilterModalOpen(false)}>
              Apply
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isAddContactModalOpen}
        onClose={() => {
          setIsAddContactModalOpen(false);
          createContactMutation.reset();
        }}
        size="sm"
        title="Add contact"
        description="Add a single contact to this workspace."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            Email *
            <Input
              value={newContact.email}
              onChange={(event) =>
                setNewContact((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="name@company.com"
              variant="filled"
              inputSize="sm"
              type="email"
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              First name
              <Input
                value={newContact.firstName}
                onChange={(event) =>
                  setNewContact((prev) => ({ ...prev, firstName: event.target.value }))
                }
                placeholder="Sofia"
                variant="filled"
                inputSize="sm"
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
              Last name
              <Input
                value={newContact.lastName}
                onChange={(event) =>
                  setNewContact((prev) => ({ ...prev, lastName: event.target.value }))
                }
                placeholder="Martinez"
                variant="filled"
                inputSize="sm"
              />
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAddContactModalOpen(false);
                createContactMutation.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                createContactMutation.mutate({
                  email: newContact.email.trim(),
                  firstName: newContact.firstName.trim() || undefined,
                  lastName: newContact.lastName.trim() || undefined,
                })
              }
              disabled={!newContact.email.trim() || createContactMutation.isPending}
            >
              {createContactMutation.isPending ? "Saving..." : "Add contact"}
            </Button>
          </div>
          {createContactMutation.error && (
            <div style={{ color: "#b04c2e", fontSize: 12 }}>
              {toErrorMessage(createContactMutation.error)}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={isTagModalOpen}
        onClose={() => {
          setIsTagModalOpen(false);
          setSelectedTagIds([]);
          setNewTagName("");
          assignTagsMutation.reset();
          createTagMutation.reset();
        }}
        size="sm"
        title="Add tags"
        description={`Assign tags to ${selected.size} selected contact${selected.size === 1 ? "" : "s"}.`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="New tag name"
              variant="filled"
              inputSize="sm"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => createTagMutation.mutate(newTagName.trim())}
              disabled={!newTagName.trim() || createTagMutation.isPending}
            >
              {createTagMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>

          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {availableTags.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>No tags yet. Create one above.</div>
            ) : (
              availableTags.map((tag) => (
                <label
                  key={tag.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12.5,
                    color: "var(--ink)",
                  }}
                >
                  <Checkbox
                    checked={selectedTagIds.includes(tag.id)}
                    onChange={() =>
                      setSelectedTagIds((prev) =>
                        prev.includes(tag.id) ? prev.filter((id) => id !== tag.id) : [...prev, tag.id],
                      )
                    }
                    aria-label={`Select tag ${tag.name}`}
                  />
                  <span>{tag.name}</span>
                </label>
              ))
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={() => setIsTagModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                assignTagsMutation.mutate({ contactIds: Array.from(selected), tagIds: selectedTagIds })
              }
              disabled={selectedTagIds.length === 0 || assignTagsMutation.isPending}
            >
              {assignTagsMutation.isPending ? "Saving..." : "Apply tags"}
            </Button>
          </div>

          {(assignTagsMutation.error || createTagMutation.error) && (
            <div style={{ color: "#b04c2e", fontSize: 12 }}>
              {toErrorMessage(assignTagsMutation.error ?? createTagMutation.error)}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={isSegmentModalOpen}
        onClose={() => {
          setIsSegmentModalOpen(false);
          setSegmentPrompt("");
          setSegmentName("");
          segmentPreviewMutation.reset();
          saveSegmentMutation.reset();
        }}
        size="md"
        title="New segment"
        description="Describe your audience, preview it, then save."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input
            value={segmentPrompt}
            onChange={(event) => setSegmentPrompt(event.target.value)}
            placeholder="Pro customers active in the last 30 days"
            variant="filled"
            inputSize="sm"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => segmentPreviewMutation.mutate()}
            disabled={!segmentPrompt.trim() || segmentPreviewMutation.isPending}
          >
            {segmentPreviewMutation.isPending ? "Generating..." : "Preview"}
          </Button>

          {segmentPreview && (
            <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10 }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                Estimated contacts: {(segmentPreview.count ?? 0).toLocaleString()}
              </div>
              <Input
                value={segmentName}
                onChange={(event) => setSegmentName(event.target.value)}
                placeholder={segmentPreview.name ?? "Segment name"}
                variant="filled"
                inputSize="sm"
                style={{ marginTop: 8 }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => saveSegmentMutation.mutate()}
                disabled={saveSegmentMutation.isPending}
                style={{ marginTop: 10 }}
              >
                {saveSegmentMutation.isPending ? "Saving..." : "Save segment"}
              </Button>
            </div>
          )}

          {(segmentPreviewMutation.error || saveSegmentMutation.error) && (
            <div style={{ color: "#b04c2e", fontSize: 12 }}>
              {toErrorMessage(segmentPreviewMutation.error ?? saveSegmentMutation.error)}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function pickDetectedColumn(columns: string[], aliases: string[]): string {
  const normalizedAliases = aliases.map((alias) => alias.toLowerCase());
  const found = columns.find((column) => normalizedAliases.includes(column.toLowerCase()));
  return found ?? "";
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unexpected error.";
}
