"use client";

import { deleteEmail, fetchEmails } from "@/actions/emails";
import { useAuthStore } from "@/stores/auth-store";
import {
  Button,
  GroupButtons,
  Icon,
  Input,
  Select,
  cx,
  useToast,
} from "@madoo/design-system";
import type { EmailDto, EmailVariantDto } from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ViewMode = "grid" | "list";
type SortMode = "updatedAt" | "createdAt" | "title";
type StatusFilter = "ANY" | EmailDto["status"];

type ProjectLibraryProps = {
  emptyTitle?: string;
  title: string;
};

const sortOptions = [
  { label: "Last edited", value: "updatedAt" },
  { label: "Created", value: "createdAt" },
  { label: "Project name", value: "title" },
] satisfies Array<{ label: string; value: SortMode }>;

const statusOptions = [
  { label: "Any status", value: "ANY" },
  { label: "Draft", value: "DRAFT" },
  { label: "Ready", value: "READY" },
  { label: "Generating", value: "GENERATING" },
  { label: "Error", value: "ERROR" },
] satisfies Array<{ label: string; value: StatusFilter }>;

const statusLabels: Record<EmailDto["status"], string> = {
  DRAFT: "Draft",
  ERROR: "Error",
  GENERATING: "Generating",
  READY: "Ready",
};

const statusClasses: Record<EmailDto["status"], string> = {
  DRAFT: "bg-madoo-bg-2 text-madoo-ink-muted",
  ERROR: "bg-[#fff1ed] text-madoo-danger",
  GENERATING: "bg-[#edf5ff] text-[#1c5d99]",
  READY: "bg-[#edf8f0] text-[#2f6f45]",
};

function latestVariant(email: EmailDto): EmailVariantDto | null {
  return email.variants[email.variants.length - 1] ?? null;
}

function projectTitle(email: EmailDto): string {
  return (
    latestVariant(email)?.subject ||
    email.title ||
    email.prompt ||
    "Untitled email"
  );
}

function projectSubtitle(email: EmailDto): string {
  const updated = formatDate(email.updatedAt);
  return email.audience ? `${email.audience} - ${updated}` : updated;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function sortEmails(items: EmailDto[], sortMode: SortMode): EmailDto[] {
  return [...items].sort((a, b) => {
    if (sortMode === "title") {
      return projectTitle(a).localeCompare(projectTitle(b));
    }

    const left = new Date(a[sortMode]).getTime();
    const right = new Date(b[sortMode]).getTime();
    return right - left;
  });
}

function useFilteredEmails(
  emails: EmailDto[],
  query: string,
  status: StatusFilter,
  sortMode: SortMode,
) {
  return useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered: EmailDto[] = [];

    for (const email of emails) {
      if (status !== "ANY" && email.status !== status) continue;

      if (normalizedQuery) {
        const searchable = [
          projectTitle(email),
          email.prompt,
          email.tone ?? "",
          email.length ?? "",
          email.audience ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(normalizedQuery)) continue;
      }

      filtered.push(email);
    }

    return sortEmails(filtered, sortMode);
  }, [emails, query, sortMode, status]);
}

function ProjectPreview({ email }: { email: EmailDto }) {
  const previewUrl = latestVariant(email)?.previewUrl;

  return (
    <div className="relative flex aspect-[4/3] min-h-[190px] items-center justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.16)]">
      {previewUrl ? (
        <img
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          src={previewUrl}
        />
      ) : (
        <Icon name="image" size={30} className="text-[#d8d3c7]" />
      )}
      <span
        className={cx(
          "absolute left-2 top-2 rounded-md px-2 py-1 text-[11px] font-medium leading-none shadow-madoo-border",
          statusClasses[email.status],
        )}
      >
        {statusLabels[email.status]}
      </span>
    </div>
  );
}

function ProjectGridCard({
  email,
  onDelete,
  onOpen,
}: {
  email: EmailDto;
  onDelete: (email: EmailDto) => void;
  onOpen: (email: EmailDto) => void;
}) {
  return (
    <article className="grid min-w-0 gap-2 rounded-lg bg-white p-3 shadow-madoo-border [content-visibility:auto]">
      <button
        aria-label={`Open ${projectTitle(email)}`}
        className="group min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none"
        onClick={() => onOpen(email)}
        type="button"
      >
        <ProjectPreview email={email} />
        <div className="mt-3 min-w-0">
          <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-[1.25] text-madoo-ink">
            {projectTitle(email)}
          </h3>
          <p className="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-none text-madoo-ink-muted">
            {projectSubtitle(email)}
          </p>
        </div>
      </button>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-madoo-ink-faint">
          {email.templateSavedAt ? "Template" : "Email"}
        </span>
        <Button
          aria-label={`Delete ${projectTitle(email)}`}
          className="h-7 w-7 rounded-md"
          onClick={() => onDelete(email)}
          size="sm"
          variant="icon"
        >
          <Icon name="x" size={13} />
        </Button>
      </div>
    </article>
  );
}

function ProjectListRow({
  email,
  onDelete,
  onOpen,
}: {
  email: EmailDto;
  onDelete: (email: EmailDto) => void;
  onOpen: (email: EmailDto) => void;
}) {
  return (
    <div className="grid min-h-[64px] grid-cols-[minmax(0,1fr)_120px_140px_40px] items-center gap-4 border-b border-[rgb(var(--rule-rgb)_/_0.65)] px-4 py-2 last:border-b-0 max-[760px]:grid-cols-[minmax(0,1fr)_40px]">
      <button
        className="grid min-w-0 cursor-pointer gap-1 border-0 bg-transparent p-0 text-left"
        onClick={() => onOpen(email)}
        type="button"
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-madoo-ink">
          {projectTitle(email)}
        </span>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-madoo-ink-muted">
          {email.prompt}
        </span>
      </button>
      <span
        className={cx(
          "w-max rounded-md px-2 py-1 text-[11px] font-medium leading-none max-[760px]:hidden",
          statusClasses[email.status],
        )}
      >
        {statusLabels[email.status]}
      </span>
      <span className="text-xs text-madoo-ink-muted max-[760px]:hidden">
        {formatDate(email.updatedAt)}
      </span>
      <Button
        aria-label={`Delete ${projectTitle(email)}`}
        className="h-7 w-7 rounded-md"
        onClick={() => onDelete(email)}
        size="sm"
        variant="icon"
      >
        <Icon name="x" size={13} />
      </Button>
    </div>
  );
}

export function ProjectLibrary({
  emptyTitle = "No projects yet",
  title,
}: ProjectLibraryProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updatedAt");
  const [status, setStatus] = useState<StatusFilter>("ANY");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
    enabled: Boolean(user),
  });

  const filteredEmails = useFilteredEmails(emails, query, status, sortMode);

  const deleteMutation = useMutation({
    mutationFn: deleteEmail,
    onSuccess: (_result, emailId) => {
      queryClient.setQueryData<EmailDto[]>(["emails"], (current) =>
        current?.filter((email) => email.id !== emailId) ?? [],
      );
      toast({ tone: "success", title: "Project deleted" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Delete failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const openEmail = (email: EmailDto) => {
    router.push(`/email-template-project?id=${encodeURIComponent(email.id)}`);
  };

  const deleteProject = (email: EmailDto) => {
    if (!window.confirm(`Delete "${projectTitle(email)}"?`)) return;
    deleteMutation.mutate(email.id);
  };

  return (
    <div className="min-h-full bg-[var(--madoo-page)] px-6 py-6 text-madoo-ink max-sm:px-4 max-sm:py-4">
      <div className="mx-auto max-w-[1580px]">
        <header className="mb-5 flex items-center justify-between gap-4">
          <h1 className="m-0 text-[24px] font-semibold leading-none tracking-normal text-[#202124]">
            {title}
          </h1>
          <Button
            leftIcon={<Icon name="plus" size={13} />}
            onClick={() => router.push("/")}
            size="sm"
            variant="secondary"
          >
            Create
          </Button>
        </header>

        <div className="grid grid-cols-[minmax(220px,1fr)_minmax(132px,160px)_minmax(132px,160px)_auto] items-center gap-2 max-[940px]:grid-cols-2 max-sm:grid-cols-1">
          <Input
            className="h-9! rounded-[9px]!"
            inputSize="md"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            startAdornment={<Icon name="search" size={15} />}
            value={query}
          />
          <Select
            label="Sort projects"
            onChange={(value) => setSortMode(value as SortMode)}
            options={sortOptions}
            size="sm"
            value={sortMode}
            variant="default"
          />
          <Select
            label="Filter by status"
            onChange={(value) => setStatus(value as StatusFilter)}
            options={statusOptions}
            size="sm"
            value={status}
            variant="default"
          />
          <div className="flex items-center justify-end max-sm:justify-end">
            <GroupButtons
              aria-label="Project view"
              items={[
                {
                  value: "grid",
                  label: "Grid view",
                  icon: <Icon key="grid-view-icon" name="grid" size={16} />,
                },
                {
                  value: "list",
                  label: "List view",
                  icon: <Icon key="list-view-icon" name="folder" size={15} />,
                },
              ]}
              onChange={(value) => setViewMode(value as ViewMode)}
              size="sm"
              value={viewMode}
            />
          </div>
        </div>

        <section className="mt-5">
          {isLoading ? (
            <div className="grid min-h-[260px] place-items-center rounded-lg bg-white p-6 text-sm text-madoo-ink-muted shadow-madoo-border">
              Loading projects
            </div>
          ) : filteredEmails.length ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                {filteredEmails.map((email) => (
                  <ProjectGridCard
                    email={email}
                    key={email.id}
                    onDelete={deleteProject}
                    onOpen={openEmail}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg bg-white shadow-madoo-border">
                {filteredEmails.map((email) => (
                  <ProjectListRow
                    email={email}
                    key={email.id}
                    onDelete={deleteProject}
                    onOpen={openEmail}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="grid min-h-[260px] place-items-center rounded-lg bg-white p-6 text-center shadow-madoo-border">
              <div className="grid justify-items-center gap-2">
                <span className="grid size-10 place-items-center rounded-lg bg-madoo-bg-2 text-madoo-ink-muted">
                  <Icon name="folder" size={20} />
                </span>
                <h3 className="m-0 text-[15px] font-medium text-madoo-ink">
                  {query || status !== "ANY" ? "No matches" : emptyTitle}
                </h3>
                <p className="m-0 max-w-sm text-[13px] leading-5 text-madoo-ink-muted">
                  {query || status !== "ANY"
                    ? "Try another search or status."
                    : "Created emails will appear here."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function ProjectsFutureState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  const router = useRouter();
  return (
    <div className="min-h-full bg-[var(--madoo-page)] px-6 py-6 text-madoo-ink max-sm:px-4 max-sm:py-4">
      <div className="mx-auto max-w-[1580px]">
        <header className="mb-5 flex items-center justify-between gap-4">
          <h1 className="m-0 text-[24px] font-semibold leading-none tracking-normal text-[#202124]">
            {title}
          </h1>
          <Button
            leftIcon={<Icon name="plus" size={13} />}
            onClick={() => router.push("/")}
            size="sm"
            variant="secondary"
          >
            Create
          </Button>
        </header>
        <div className="grid min-h-[300px] place-items-center rounded-lg bg-white p-6 text-center shadow-madoo-border">
          <div className="grid justify-items-center gap-2">
            <span className="grid size-10 place-items-center rounded-lg bg-madoo-bg-2 text-madoo-ink-muted">
              <Icon name="folder" size={20} />
            </span>
            <h2 className="m-0 text-[15px] font-medium text-madoo-ink">
              Not available yet
            </h2>
            <p className="m-0 max-w-sm text-[13px] leading-5 text-madoo-ink-muted">
              {body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
