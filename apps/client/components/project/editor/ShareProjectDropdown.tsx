import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Dropdown, DropdownContent, DropdownTrigger, Input, Select, useToast } from "@madoo/design-system";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Globe02Icon, LinkSquare02Icon, Share08Icon, SquareLock02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { EmailDto } from "@madoo/shared";
import { fetchWorkspaces } from "@/actions/workspaces";
import { updateEmailShare } from "@/actions/emails";
import { shareEmailToCommunity } from "@/actions/community-templates";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import { cn } from "@/lib/utils";
import { AccessLevelSelect, type AccessLevel } from "@/components/project/share/AccessLevelSelect";
import { HeaderPillButton } from "./HeaderPillButton";

function getEmailTitle(email: EmailDto): string {
  const latestVariant = email.variants[email.variants.length - 1];
  const title =
    latestVariant?.subject || email.title || email.prompt || "Untitled email";
  const trimmed = title.trim() || "Untitled email";
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
}

export function ShareProjectDropdown({
  email,
  emailId,
}: {
  email: EmailDto | null | undefined;
  emailId: string | null;
}) {
  const user = useAuthStore((state) => state.user);
  const workspaceId = useClientStore((state) => state.workspaceId);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("edit");
  const [communityShared, setCommunityShared] = useState(false);
  const [shareSeq, setShareSeq] = useState<number | null>(null);

  // Versions ordered newest → oldest for the publish picker; default = latest.
  const variantsDesc = useMemo(
    () => [...(email?.variants ?? [])].sort((a, b) => b.seq - a.seq),
    [email?.variants],
  );
  const latestSeq = variantsDesc[0]?.seq ?? null;
  const selectedSeq = shareSeq ?? latestSeq;

  useEffect(() => {
    setCommunityShared(false);
    setShareSeq(null);
  }, [emailId]);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
    enabled: Boolean(user),
    staleTime: 60_000,
  });
  const activeWorkspace =
    workspaces.find((item) => item.id === workspaceId) ?? workspaces[0] ?? null;
  const workspaceName = activeWorkspace?.name ?? "Madoo workspace";
  const workspaceInitial = workspaceName.trim().charAt(0).toUpperCase() || "M";

  const isPublic = email?.visibility === "PUBLIC";
  const publicUrl = useMemo(() => {
    if (!email?.publicId) return null;
    const path = `/share/${email.publicId}`;
    if (typeof window === "undefined") return path;
    return new URL(path, window.location.origin).toString();
  }, [email?.publicId]);

  const shareMutation = useMutation({
    mutationFn: (visibility: "PUBLIC" | "PRIVATE") => {
      if (!emailId) throw new Error("Generate an email first.");
      return updateEmailShare(emailId, { visibility });
    },
    onSuccess: async (_data, visibility) => {
      await queryClient.invalidateQueries({ queryKey: ["email", emailId] });
      toast({
        tone: "success",
        title:
          visibility === "PUBLIC" ? "Public link enabled" : "Link set to private",
        body:
          visibility === "PUBLIC"
            ? "Anyone with the link can now view this email."
            : "The public link no longer opens this email.",
      });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Could not update sharing",
        body:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    },
  });

  const communityShareMutation = useMutation({
    mutationFn: () => {
      if (!emailId || !email) throw new Error("Generate an email first.");
      return shareEmailToCommunity({
        emailId,
        variantSeq: selectedSeq ?? undefined,
        name: getEmailTitle(email),
        description: null,
        category: "Other",
        categories: ["Other"],
      });
    },
    onSuccess: async () => {
      setCommunityShared(true);
      await queryClient.invalidateQueries({ queryKey: ["community-templates"] });
      toast({
        tone: "success",
        title: "Shared to community",
        body: "People can now discover and use this template.",
      });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Community share failed",
        body:
          error instanceof Error ? error.message : "Try again in a moment.",
      });
    },
  });

  const copyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ tone: "danger", title: "Copy failed" });
    }
  };

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <HeaderPillButton
          className="bg-white text-[#101114] hover:bg-[#f3f4f6]"
          label="Share email"
          leftIcon={Share08Icon}
        >
          Share
        </HeaderPillButton>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-[min(88vw,420px)] gap-0 p-0!">
        <div className="grid gap-4 p-4">
          <div className="grid gap-1">
            <h3 className="text-lg font-semibold tracking-normal text-madoo-ink">
              Share email
            </h3>
            <p className="text-xs text-madoo-ink-muted">
              Create a public link so clients can preview this email — no Madoo
              account needed.
            </p>
          </div>

          <div className="grid gap-3 rounded-xl bg-madoo-surface-2 p-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg",
                  isPublic
                    ? "bg-madoo-ink text-white"
                    : "bg-white text-madoo-ink shadow-madoo-border",
                )}
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={isPublic ? Globe02Icon : SquareLock02Icon}
                  primaryColor="currentColor"
                  size={18}
                  strokeWidth={1.7}
                />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate text-sm font-medium text-madoo-ink">
                  {isPublic ? "Public link" : "Private"}
                </span>
                <span className="truncate text-xs text-madoo-ink-muted">
                  {isPublic
                    ? "Anyone with the link can view"
                    : "Only your workspace can access"}
                </span>
              </span>
              <Button
                className="h-8 rounded-lg"
                disabled={!emailId || shareMutation.isPending}
                onClick={() =>
                  shareMutation.mutate(isPublic ? "PRIVATE" : "PUBLIC")
                }
                size="sm"
                type="button"
                variant={isPublic ? "secondary" : "primary"}
              >
                {shareMutation.isPending
                  ? "Saving…"
                  : isPublic
                    ? "Make private"
                    : "Create link"}
              </Button>
            </div>

            {isPublic && publicUrl ? (
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    aria-label="Public share link"
                    className="h-9! bg-white!"
                    inputSize="lg"
                    onFocus={(event) => event.currentTarget.select()}
                    readOnly
                    value={publicUrl}
                    variant="default"
                  />
                </div>
                <Button
                  aria-label="Copy public link"
                  className="h-9 min-w-20 rounded-lg"
                  leftIcon={
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={copied ? Tick02Icon : Copy01Icon}
                      primaryColor="currentColor"
                      size={15}
                      strokeWidth={1.8}
                    />
                  }
                  onClick={copyLink}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
                <a
                  aria-label="Open public link"
                  className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-madoo-ink shadow-madoo-border transition hover:bg-madoo-surface"
                  href={publicUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={LinkSquare02Icon}
                    primaryColor="currentColor"
                    size={16}
                    strokeWidth={1.7}
                  />
                </a>
              </div>
            ) : null}
          </div>

          <div className="h-px bg-[rgb(var(--rule-rgb)/0.14)]" />

          <div className="grid gap-2">
            <div className="flex items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-madoo-ink shadow-madoo-border">
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Globe02Icon}
                  primaryColor="currentColor"
                  size={18}
                  strokeWidth={1.7}
                />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate text-sm font-medium text-madoo-ink">
                  Community
                </span>
                <span className="truncate text-xs text-madoo-ink-muted">
                  Let other Madoo users discover and use this template
                </span>
              </span>
              <Button
                className="h-8 rounded-lg"
                disabled={
                  !emailId ||
                  !email ||
                  communityShared ||
                  variantsDesc.length === 0 ||
                  communityShareMutation.isPending
                }
                onClick={() => communityShareMutation.mutate()}
                size="sm"
                type="button"
                variant="secondary"
              >
                {communityShareMutation.isPending
                  ? "Sharing…"
                  : communityShared
                    ? "Shared"
                    : "Share"}
              </Button>
            </div>

            {variantsDesc.length > 1 ? (
              <div className="flex items-center gap-2 pl-12">
                <span className="shrink-0 text-xs text-madoo-ink-muted">
                  Publish version
                </span>
                <Select
                  align="end"
                  onChange={(value) => setShareSeq(Number(value))}
                  options={variantsDesc.map((v) => ({
                    value: String(v.seq),
                    label:
                      v.seq === latestSeq
                        ? `Version ${v.seq} · latest`
                        : `Version ${v.seq}`,
                  }))}
                  size="sm"
                  value={String(selectedSeq ?? "")}
                  variant="surface"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-semibold text-madoo-ink-muted">
              Who has access
            </p>
            <div className="flex items-center gap-3">
              <Avatar
                name={user?.name ?? user?.email ?? "User"}
                src={user?.avatarUrl ?? undefined}
                size="sm"
              />
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate text-sm font-medium text-madoo-ink">
                  {user?.name ?? "User"} (you)
                </span>
                <span className="truncate text-xs text-madoo-ink-muted">
                  {user?.email ?? "Signed in user"}
                </span>
              </span>
              <span className="text-xs font-medium text-madoo-ink-muted">
                Owner
              </span>
            </div>
            <div className="h-px bg-[rgb(var(--rule-rgb)/0.14)]" />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-madoo-ink text-xs font-semibold text-white">
                {workspaceInitial}
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <span className="truncate text-sm font-medium text-madoo-ink">
                  {workspaceName}
                </span>
                <span className="truncate text-xs text-madoo-ink-muted">
                  People in this workspace
                </span>
              </span>
              <AccessLevelSelect
                onChange={setAccessLevel}
                value={accessLevel}
              />
            </div>
          </div>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
