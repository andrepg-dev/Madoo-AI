"use client";

import {
  deleteEmail,
  fetchEmails,
  renameEmail,
  setEmailStarred,
  transferEmail,
} from "@/actions/emails";
import { fetchWorkspaces } from "@/actions/workspaces";
import { useAuthStore } from "@/stores/auth-store";
import {
  Button,
  Dropdown,
  DropdownContent,
  DropdownDivider,
  DropdownItem,
  DropdownTrigger,
  GroupButtons,
  Icon,
  Input,
  Modal,
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
type ProjectActionDialog =
  | { type: "delete"; email: EmailDto }
  | { type: "rename"; email: EmailDto }
  | { type: "transfer"; email: EmailDto }
  | null;

type ProjectLibraryProps = {
  emptyTitle?: string;
  title: string;
  /** When true, only show starred projects (e.g. the Starred view). */
  starredOnly?: boolean;
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

const compactMenuItemClass = "justify-start! px-2! py-1.5! text-[13px]!";

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
  starredOnly: boolean,
) {
  return useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered: EmailDto[] = [];

    for (const email of emails) {
      if (starredOnly && !email.starred) continue;
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
  }, [emails, query, sortMode, status, starredOnly]);
}

function ProjectPreview({ email }: { email: EmailDto }) {
  const previewUrl = latestVariant(email)?.previewUrl;

  return (
    <div className="relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.16)]">
      {previewUrl ? (
        <img
          alt=""
          className="h-full w-full object-cover object-top"
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
      {email.starred ? (
        <span className="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-md bg-white/90 text-amber-500 shadow-madoo-border backdrop-blur">
          <Icon name="star" size={13} />
        </span>
      ) : null}
    </div>
  );
}

function ProjectGridCard({
  email,
  onDelete,
  onRename,
  onOpen,
  onToggleStar,
  onTransfer,
}: {
  email: EmailDto;
  onDelete: (email: EmailDto) => void;
  onRename: (email: EmailDto) => void;
  onOpen: (email: EmailDto) => void;
  onToggleStar: (email: EmailDto) => void;
  onTransfer: (email: EmailDto) => void;
}) {
  const title = projectTitle(email);

  return (
    <article className="grid min-w-0 gap-2 rounded-lg bg-white p-3 shadow-madoo-border">
      <button
        aria-label={`Open ${title}`}
        className="group min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none"
        onClick={() => onOpen(email)}
        type="button"
      >
        <ProjectPreview email={email} />
      </button>
      <div className="mt-1 flex min-w-0 items-center justify-between gap-3">
        <button
          aria-label={`Open ${title}`}
          className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none"
          onClick={() => onOpen(email)}
          type="button"
        >
          <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold leading-[1.25] text-madoo-ink">
            {title}
          </h3>
          <p className="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-none text-madoo-ink-muted">
            {projectSubtitle(email)}
          </p>
        </button>
        <ProjectActionsMenu
          email={email}
          onDelete={onDelete}
          onRename={onRename}
          onToggleStar={onToggleStar}
          onTransfer={onTransfer}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-madoo-ink-faint">
          {email.templateSavedAt ? "Template" : "Email"}
        </span>
      </div>
    </article>
  );
}

function ProjectListRow({
  email,
  onDelete,
  onRename,
  onOpen,
  onToggleStar,
  onTransfer,
}: {
  email: EmailDto;
  onDelete: (email: EmailDto) => void;
  onRename: (email: EmailDto) => void;
  onOpen: (email: EmailDto) => void;
  onToggleStar: (email: EmailDto) => void;
  onTransfer: (email: EmailDto) => void;
}) {
  const title = projectTitle(email);

  return (
    <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_120px_140px_40px] items-center gap-4 px-4 py-2 shadow-(--shadow-border-bottom-soft) last:shadow-none max-[760px]:grid-cols-[minmax(0,1fr)_40px]">
      <button
        className="grid min-w-0 cursor-pointer gap-1 border-0 bg-transparent p-0 text-left"
        onClick={() => onOpen(email)}
        type="button"
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium text-madoo-ink">
          {title}
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
      <ProjectActionsMenu
        email={email}
        onDelete={onDelete}
        onRename={onRename}
        onToggleStar={onToggleStar}
        onTransfer={onTransfer}
      />
    </div>
  );
}

function ProjectActionsMenu({
  email,
  onDelete,
  onRename,
  onToggleStar,
  onTransfer,
}: {
  email: EmailDto;
  onDelete: (email: EmailDto) => void;
  onRename: (email: EmailDto) => void;
  onToggleStar: (email: EmailDto) => void;
  onTransfer: (email: EmailDto) => void;
}) {
  const title = projectTitle(email);

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          aria-label={`Open actions for ${title}`}
          className="min-h-8 min-w-8 shrink-0 rounded-md px-0!"
          size="sm"
          variant="ghost"
        >
          <Icon name="moreHorizontal" size={14} />
        </Button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-50 gap-0.5 overflow-hidden p-1!">
        <DropdownItem
          className={compactMenuItemClass}
          onSelect={() => onToggleStar(email)}
        >
          <span className="flex items-center gap-2.5">
            <Icon name="star" size={14} />
            {email.starred ? "Unstar" : "Star"}
          </span>
        </DropdownItem>
        <DropdownItem
          className={compactMenuItemClass}
          onSelect={() => onRename(email)}
        >
          <span className="flex items-center gap-2.5">
            <Icon name="edit" size={14} />
            Rename
          </span>
        </DropdownItem>
        <DropdownItem
          className={compactMenuItemClass}
          onSelect={() => onTransfer(email)}
        >
          <span className="flex items-center gap-2.5">
            <Icon name="folder" size={14} />
            Transfer to workspace
          </span>
        </DropdownItem>
        <DropdownDivider className="my-0.5" />
        <DropdownItem
          className={cx(
            compactMenuItemClass,
            "text-madoo-danger hover:text-madoo-danger focus-visible:text-madoo-danger",
          )}
          onSelect={() => onDelete(email)}
        >
          <span className="flex items-center gap-2.5">
            <Icon name="delete" size={14} />
            Delete
          </span>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

export function ProjectLibrary({
  emptyTitle = "No projects yet",
  title,
  starredOnly = false,
}: ProjectLibraryProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("updatedAt");
  const [status, setStatus] = useState<StatusFilter>("ANY");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [actionDialog, setActionDialog] = useState<ProjectActionDialog>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [transferWorkspaceId, setTransferWorkspaceId] = useState("");

  const { data: emails = [], isLoading } = useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
    enabled: Boolean(user),
  });
  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
    enabled: Boolean(user),
  });

  const filteredEmails = useFilteredEmails(
    emails,
    query,
    status,
    sortMode,
    starredOnly,
  );
  const transferTargets =
    actionDialog?.type === "transfer"
      ? workspaces.filter(
          (workspace) => workspace.id !== actionDialog.email.workspaceId,
        )
      : [];
  const selectedTransferWorkspace =
    transferTargets.find((workspace) => workspace.id === transferWorkspaceId) ??
    null;

  const deleteMutation = useMutation({
    mutationFn: deleteEmail,
    onSuccess: (_result, emailId) => {
      queryClient.setQueryData<EmailDto[]>(["emails"], (current) =>
        current?.filter((email) => email.id !== emailId) ?? [],
      );
      setActionDialog(null);
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
  const renameMutation = useMutation({
    mutationFn: ({ email, title }: { email: EmailDto; title: string }) =>
      renameEmail(email.id, { title }),
    onSuccess: (updatedEmail) => {
      queryClient.setQueryData<EmailDto[]>(["emails"], (current) =>
        current?.map((email) =>
          email.id === updatedEmail.id ? updatedEmail : email,
        ) ?? [],
      );
      setActionDialog(null);
      toast({ tone: "success", title: "Project renamed" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Rename failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });
  const transferMutation = useMutation({
    mutationFn: ({
      email,
      targetWorkspaceId,
    }: {
      email: EmailDto;
      targetWorkspaceId: string;
    }) => transferEmail(email.id, { targetWorkspaceId }),
    onSuccess: (updatedEmail) => {
      queryClient.setQueryData<EmailDto[]>(["emails"], (current) =>
        current?.filter((email) => email.id !== updatedEmail.id) ?? [],
      );
      setActionDialog(null);
      toast({ tone: "success", title: "Project transferred" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Transfer failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const starMutation = useMutation({
    mutationFn: ({ email, starred }: { email: EmailDto; starred: boolean }) =>
      setEmailStarred(email.id, starred),
    onSuccess: (updatedEmail) => {
      queryClient.setQueryData<EmailDto[]>(["emails"], (current) =>
        current?.map((email) =>
          email.id === updatedEmail.id ? updatedEmail : email,
        ) ?? [],
      );
      toast({
        tone: "success",
        title: updatedEmail.starred ? "Project starred" : "Project unstarred",
      });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Could not update star",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const toggleStar = (email: EmailDto) => {
    starMutation.mutate({ email, starred: !email.starred });
  };

  const closeActionDialog = () => {
    if (
      deleteMutation.isPending ||
      renameMutation.isPending ||
      transferMutation.isPending
    ) {
      return;
    }
    setActionDialog(null);
  };

  const openEmail = (email: EmailDto) => {
    router.push(`/email-template-project?id=${encodeURIComponent(email.id)}`);
  };

  const deleteProject = (email: EmailDto) => {
    setActionDialog({ type: "delete", email });
  };

  const renameProject = (email: EmailDto) => {
    setRenameTitle(projectTitle(email));
    setActionDialog({ type: "rename", email });
  };

  const transferProject = (email: EmailDto) => {
    const targets = workspaces.filter(
      (workspace) => workspace.id !== email.workspaceId,
    );
    if (targets.length === 0) {
      setTransferWorkspaceId("");
    } else {
      setTransferWorkspaceId(targets[0].id);
    }
    setActionDialog({ type: "transfer", email });
  };

  const submitRename = () => {
    const title = renameTitle.trim();
    if (!actionDialog || actionDialog.type !== "rename" || !title) return;
    renameMutation.mutate({ email: actionDialog.email, title });
  };

  const submitTransfer = () => {
    if (!actionDialog || actionDialog.type !== "transfer" || !transferWorkspaceId) {
      return;
    }
    transferMutation.mutate({
      email: actionDialog.email,
      targetWorkspaceId: transferWorkspaceId,
    });
  };

  const submitDelete = () => {
    if (!actionDialog || actionDialog.type !== "delete") return;
    deleteMutation.mutate(actionDialog.email.id);
  };

  return (
    <>
      <div className="min-h-full bg-(--madoo-page) px-6 py-6 text-madoo-ink max-sm:px-4 max-sm:py-4">
        <div className="mx-auto max-w-395">
        <header className="mb-5 flex items-center justify-between gap-4">
          <h1 className="m-0 text-[24px] font-semibold leading-none tracking-normal text-[#202124]">
            {title}
          </h1>
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
            <div className="grid min-h-65 place-items-center rounded-lg bg-white p-6 text-sm text-madoo-ink-muted shadow-madoo-border">
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
                    onRename={renameProject}
                    onToggleStar={toggleStar}
                    onTransfer={transferProject}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white shadow-madoo-border">
                {filteredEmails.map((email) => (
                  <ProjectListRow
                    email={email}
                    key={email.id}
                    onDelete={deleteProject}
                    onOpen={openEmail}
                    onRename={renameProject}
                    onToggleStar={toggleStar}
                    onTransfer={transferProject}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="grid min-h-65 place-items-center rounded-lg bg-white p-6 text-center shadow-madoo-border">
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
      <Modal
        description="Update the name shown on this project card."
        footer={
          <>
            <Button onClick={closeActionDialog} variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={!renameTitle.trim() || renameMutation.isPending}
              onClick={submitRename}
              variant="primary"
            >
              {renameMutation.isPending ? "Saving" : "Save"}
            </Button>
          </>
        }
        onClose={closeActionDialog}
        open={actionDialog?.type === "rename"}
        size="sm"
        title="Rename project"
      >
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitRename();
          }}
        >
          <Input
            autoFocus
            label="Project name"
            onChange={(event) => setRenameTitle(event.target.value)}
            value={renameTitle}
          />
        </form>
      </Modal>
      <Modal
        description="Move this project and its generated email history to another workspace."
        footer={
          <>
            <Button onClick={closeActionDialog} variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={!selectedTransferWorkspace || transferMutation.isPending}
              onClick={submitTransfer}
              variant="primary"
            >
              {transferMutation.isPending ? "Transferring" : "Transfer"}
            </Button>
          </>
        }
        onClose={closeActionDialog}
        open={actionDialog?.type === "transfer"}
        size="sm"
        title="Transfer to workspace"
      >
        {transferTargets.length ? (
          <div className="grid gap-3">
            <Select
              label="Workspace"
              onChange={setTransferWorkspaceId}
              options={transferTargets.map((workspace) => ({
                label: workspace.name,
                value: workspace.id,
              }))}
              value={transferWorkspaceId}
            />
            {selectedTransferWorkspace ? (
              <p className="m-0 text-[13px] leading-5 text-madoo-ink-muted">
                This project will disappear from the current workspace after transfer.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="m-0 text-[13px] leading-5 text-madoo-ink-muted">
            No other workspace available.
          </p>
        )}
      </Modal>
      <Modal
        description="This project and its generated emails will be permanently removed."
        footer={
          <>
            <Button onClick={closeActionDialog} variant="ghost">
              Cancel
            </Button>
            <Button
              disabled={deleteMutation.isPending}
              onClick={submitDelete}
              variant="danger"
            >
              {deleteMutation.isPending ? "Deleting" : "Delete"}
            </Button>
          </>
        }
        onClose={closeActionDialog}
        open={actionDialog?.type === "delete"}
        size="sm"
        title="Delete project"
      >
        <p className="m-0 text-[13px] leading-5 text-madoo-ink-muted">
          {actionDialog?.type === "delete"
            ? `Delete "${projectTitle(actionDialog.email)}"?`
            : null}
        </p>
      </Modal>
    </>
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
    <div className="min-h-full bg-(--madoo-page) px-6 py-6 text-madoo-ink max-sm:px-4 max-sm:py-4">
      <div className="mx-auto max-w-395">
        <header className="mb-5 flex items-center justify-between gap-4">
          <h1 className="m-0 text-[24px] font-semibold leading-none tracking-normal text-[#202124]">
            {title}
          </h1>
        </header>
        <div className="grid min-h-75 place-items-center rounded-lg bg-white p-6 text-center shadow-madoo-border">
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
