"use client";

import {
  createEmail,
  fetchEmail,
  fetchEmailChat,
  updateEmailShare,
} from "@/actions/emails";
import { fetchBillingOverview } from "@/actions/billing";
import { fetchWorkspaces } from "@/actions/workspaces";
import {
  createGmailDraft,
  createOutlookDraft,
  fetchConnections,
  getConnectionAuthorizeUrl,
} from "@/actions/connections";
import { consumePendingPrompt } from "@/actions/prompts";
import {
  AUTOMATION_INSTRUCTIONS,
  ESP_INSTRUCTIONS,
  ESP_NAME_TO_PROVIDER,
} from "@/lib/export-instructions";
import { ClientPromptBox } from "@/components/home/ClientPromptBox";
import type { PromptSubmitInput } from "@/components/home/ClientPromptBox";
import { PreviewOverlay } from "@/components/project/preview/PreviewOverlay";
import { TestingModal } from "@/components/project/testing/TestingModal";
import { PricingDrawer } from "@/components/shell/PricingDrawer";
import {
  consumeEmailSseStream,
  type StreamEmailEvent,
} from "@/lib/email-stream";
import { playCompletionSound } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import {
  ArrowDown01Icon,
  ArrowDown02Icon,
  ArrowLeft01Icon,
  Copy01Icon,
  CrownPlusIcon,
  Download01Icon,
  Edit02Icon,
  EyeIcon,
  FileExportIcon,
  Globe02Icon,
  HelpCircleIcon,
  LinkSquare02Icon,
  Moon02Icon,
  PanelLeftIcon,
  PanelRightIcon,
  Plug01Icon,
  RefreshIcon,
  Settings01Icon,
  Share08Icon,
  SparklesIcon,
  SourceCodeIcon,
  SquareLock02Icon,
  StarIcon,
  TestTube02Icon,
  Tick02Icon,
  Sun01Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Avatar,
  Button,
  Card,
  Dropdown,
  DropdownContent,
  DropdownDivider,
  DropdownItem,
  DropdownTrigger,
  Input,
  Modal,
  ProgressBar,
  SegmentedControl,
  useToast,
} from "@madoo/design-system";
import type {
  ConnectionProvider,
  EmailChatMessageDto,
  EmailDto,
} from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type CSSProperties,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: IconSvgElement;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Button
      aria-label={label}
      className="h-6 w-6 rounded-md"
      onClick={onClick}
      variant="icon"
      size="sm"
    >
      <HugeiconsIcon
        aria-hidden="true"
        icon={icon}
        primaryColor="currentColor"
        size={13}
        strokeWidth={1.5}
      />
    </Button>
  );
}

function HeaderMenuIcon({ icon }: { icon: IconSvgElement }) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      icon={icon}
      primaryColor="currentColor"
      size={16}
      strokeWidth={1.55}
    />
  );
}

function formatCreditReset(value: string | undefined): string {
  if (!value) return "next month";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "next month";
  }
}

function ConversationTitleDropdown({ title }: { title: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const workspaceId = useClientStore((state) => state.workspaceId);
  const [starred, setStarred] = useState(false);

  const { data: billingOverview, isLoading: billingLoading } = useQuery({
    queryKey: ["billing-overview", workspaceId],
    queryFn: fetchBillingOverview,
    enabled: Boolean(user && workspaceId),
  });

  const usage = billingOverview?.usage.aiGenerations;
  const usageLimit = usage?.limit ?? 0;
  const creditsLeft =
    usageLimit === -1 ? null : Math.max(usageLimit - (usage?.used ?? 0), 0);
  const creditsPct =
    usageLimit === -1
      ? 100
      : usageLimit > 0 && creditsLeft !== null
        ? Math.min(100, Math.round((creditsLeft / usageLimit) * 100))
        : 0;
  const creditsText = billingLoading
    ? "Loading"
    : usageLimit === -1
      ? "Unlimited"
      : `${creditsLeft ?? 0} left`;

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          className="h-8 max-w-[min(360px,calc(100vw-32px))] gap-1.5 px-2.5 py-0! text-[13px]"
          variant="ghost"
        >
          <Image
            src={"/madoo-transparent.png"}
            alt="Madoo AI Logo"
            width={20}
            height={20}
          />
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium">{title}</span>
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowDown01Icon}
              primaryColor="currentColor"
              className="size-4 shrink-0 text-madoo-ink-muted"
            />
          </div>
        </Button>
      </DropdownTrigger>
      <DropdownContent align="start" className="w-72 gap-1 p-1.5!">
        <DropdownItem
          className="justify-start! px-2! py-1.5! text-[13px]!"
          onSelect={() => router.push("/dashboard/projects")}
        >
          <span className="flex items-center gap-2.5">
            <HeaderMenuIcon icon={ArrowLeft01Icon} />
            Back to dashboard
          </span>
        </DropdownItem>
        <DropdownDivider />

        <DropdownItem
          className="justify-start! gap-2 px-2! py-1.5!"
          onSelect={() => router.push("/settings")}
        >
          <Avatar
            name={user?.name ?? user?.email ?? "User"}
            src={user?.avatarUrl ?? undefined}
            size="sm"
          />
          <span className="grid min-w-0 flex-1 gap-0.5 text-left">
            <span className="truncate font-medium">
              {user?.name ?? "User profile"}
            </span>
            <span className="truncate text-xs text-madoo-ink-muted">
              {user?.email ?? "Manage your profile"}
            </span>
          </span>
        </DropdownItem>

        <Card surface="secondary" className="grid gap-1.5 p-2!">
          <div className="flex items-center justify-between gap-2">
            <span className="text-(length:--font-size-base) font-normal">
              Credits
            </span>
            <span className="text-(length:--font-size-sm) text-madoo-ink-muted">
              {creditsText}
            </span>
          </div>
          <ProgressBar value={creditsPct} tone="ink" label="Credits left" />
          <span className="text-(length:--font-size-sm) text-madoo-ink-muted">
            Credits reset {formatCreditReset(usage?.resetsAt)}
          </span>
        </Card>

        <DropdownDivider />

        <DropdownItem
          className="justify-start! px-2! py-1! text-[13px]!"
          onSelect={() => router.push("/settings")}
        >
          <span className="flex items-center gap-2.5">
            <HeaderMenuIcon icon={Settings01Icon} />
            Settings
          </span>
        </DropdownItem>
        <DropdownItem
          className="justify-start! px-2! py-1! text-[13px]!"
          onSelect={() =>
            toast({ tone: "default", title: "Providers coming soon" })
          }
        >
          <span className="flex items-center gap-2.5">
            <HeaderMenuIcon icon={Plug01Icon} />
            Providers
          </span>
        </DropdownItem>
        <DropdownItem
          className="justify-start! px-2! py-1! text-[13px]!"
          onSelect={() => {
            setStarred((value) => !value);
            toast({
              tone: "success",
              title: starred ? "Project unstarred" : "Project starred",
            });
          }}
        >
          <span className="flex items-center gap-2.5">
            <HeaderMenuIcon icon={StarIcon} />
            {starred ? "Unstar project" : "Star project"}
          </span>
        </DropdownItem>
        <DropdownItem
          className="justify-start! px-2! py-1! text-[13px]!"
          onSelect={() => router.push("/settings?area=support")}
        >
          <span className="flex items-center gap-2.5">
            <HeaderMenuIcon icon={HelpCircleIcon} />
            Help
          </span>
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "status" | "error";
  content: string;
};

type PreviewMode = "desktop" | "responsive";
type TemplateTheme = "light" | "dark";
type ExportProvider = {
  name: string;
  iconSrc: string;
  badge?: string;
};
type ExportFileFormat = {
  name: string;
  description: string;
  icon: IconSvgElement;
};

const minPreviewWidthVw = 52;
const defaultPreviewWidthVw = 64;
const maxPreviewWidthVw = 78;
const previewModeItems = [
  { value: "desktop", label: "Desktop" },
  { value: "responsive", label: "Responsive" },
];

function clampPreviewWidth(width: number) {
  return Math.min(maxPreviewWidthVw, Math.max(minPreviewWidthVw, width));
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

function latestVariant(email: EmailDto | null | undefined) {
  return email?.variants[email.variants.length - 1] ?? null;
}

function mapChatMessages(
  chat: EmailChatMessageDto[] | undefined,
  email: EmailDto | null | undefined,
): ChatMessage[] {
  const visibleChat: ChatMessage[] =
    chat
      ?.filter((message) => message.kind !== "THINKING")
      .map((message) => ({
        id: message.id,
        role:
          message.role === "USER"
            ? "user"
            : message.kind === "STATUS"
              ? "status"
              : "assistant",
        content: message.content,
      })) ?? [];

  // Always lead with the user's brief, even before the chat rows have loaded.
  const messages: ChatMessage[] =
    email && !visibleChat.some((message) => message.role === "user")
      ? [{ id: `${email.id}-prompt`, role: "user", content: email.prompt }, ...visibleChat]
      : visibleChat;

  // While generating (e.g. after a reload, with no live SSE), keep a visible
  // progress line until the assistant reply lands instead of a lone bubble.
  if (
    email?.status === "GENERATING" &&
    !messages.some(
      (message) => message.role === "assistant" || message.role === "status",
    )
  ) {
    messages.push({
      id: `${email.id}-generating`,
      role: "status",
      content: "Generating your email…",
    });
  }

  return messages;
}

function deriveConversationTitle(
  messages: ChatMessage[],
  fallback: string,
): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const title = firstUserMessage?.content.replace(/\s+/g, " ").trim();
  if (!title) return fallback;
  return title.length > 48 ? `${title.slice(0, 45).trimEnd()}...` : title;
}

function upsertMessage(list: ChatMessage[], next: ChatMessage) {
  const index = list.findIndex((message) => message.id === next.id);
  if (index === -1) return [...list, next];
  const copy = [...list];
  copy[index] = next;
  return copy;
}

function HeaderPillButton({
  children,
  className,
  leftIcon,
  label,
  onClick,
  style,
}: {
  children: string;
  className?: string;
  leftIcon?: IconSvgElement;
  label: string;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <Button
      aria-label={label}
      className={cn(
        "h-7 rounded-full px-3 text-xs font-medium shadow-madoo-border",
        className,
      )}
      onClick={onClick}
      size="sm"
      style={style}
      variant="secondary"
    >
      {leftIcon ? (
        <HugeiconsIcon
          aria-hidden="true"
          icon={leftIcon}
          primaryColor="currentColor"
          size={15}
          strokeWidth={1.55}
        />
      ) : null}
      <span>{children}</span>
    </Button>
  );
}

function ShareProjectDropdown({
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
            <div className="flex items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-madoo-ink text-xs font-semibold text-white">
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
              <span className="text-xs font-medium text-madoo-ink-muted">
                Can edit
              </span>
            </div>
          </div>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}

type ExportTab = "email" | "application" | "file";

const emailExportProviders: readonly ExportProvider[] = [
  {
    name: "Mailchimp",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=64",
  },
  {
    name: "Klaviyo",
    iconSrc: "https://www.google.com/s2/favicons?domain=klaviyo.com&sz=64",
  },
  {
    name: "HubSpot",
    iconSrc: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=64",
  },
  {
    name: "Brevo",
    iconSrc: "https://www.google.com/s2/favicons?domain=brevo.com&sz=64",
  },
  {
    name: "MailerLite",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailerlite.com&sz=64",
  },
  {
    name: "ConvertKit",
    iconSrc: "https://www.google.com/s2/favicons?domain=convertkit.com&sz=64",
  },
  {
    name: "ActiveCampaign",
    iconSrc: "https://www.google.com/s2/favicons?domain=activecampaign.com&sz=64",
  },
  {
    name: "Customer.io",
    iconSrc: "https://www.google.com/s2/favicons?domain=customer.io&sz=64",
  },
  {
    name: "Braze",
    iconSrc: "https://www.google.com/s2/favicons?domain=braze.com&sz=64",
  },
  {
    name: "Marketo",
    iconSrc: "https://www.google.com/s2/favicons?domain=marketo.com&sz=64",
  },
  {
    name: "Salesforce",
    iconSrc: "https://www.google.com/s2/favicons?domain=salesforce.com&sz=64",
  },
] as const;

const applicationExportProviders: readonly ExportProvider[] = [
  {
    name: "Gmail",
    iconSrc: "https://www.google.com/s2/favicons?domain=gmail.com&sz=128",
  },
  {
    name: "Google Cloud",
    iconSrc: "https://www.google.com/s2/favicons?domain=cloud.google.com&sz=128",
    badge: "fast",
  },
  {
    name: "Make",
    iconSrc: "https://www.google.com/s2/favicons?domain=make.com&sz=128",
  },
  {
    name: "n8n.io",
    iconSrc: "https://www.google.com/s2/favicons?domain=n8n.io&sz=128",
  },
  {
    name: "Outlook App",
    iconSrc: "https://www.google.com/s2/favicons?domain=outlook.com&sz=128",
  },
  {
    name: "Outlook Web",
    iconSrc: "https://www.google.com/s2/favicons?domain=office.com&sz=128",
  },
  {
    name: "Webhook",
    iconSrc: "https://www.google.com/s2/favicons?domain=webhook.site&sz=128",
  },
  {
    name: "Zapier",
    iconSrc: "https://www.google.com/s2/favicons?domain=zapier.com&sz=128",
  },
] as const;

const fileExportFormats: readonly ExportFileFormat[] = [
  {
    name: "AMPHTML",
    description: "AMP-compatible markup",
    icon: SourceCodeIcon,
  },
  {
    name: "HTML",
    description: "Production email HTML",
    icon: SourceCodeIcon,
  },
  {
    name: "Image",
    description: "Static preview image",
    icon: Download01Icon,
  },
  {
    name: "PDF",
    description: "Shareable document",
    icon: Download01Icon,
  },
] as const;

function ExportTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "h-8 cursor-pointer rounded-lg px-3 text-xs font-medium transition",
        active
          ? "bg-white text-madoo-ink shadow-madoo-border"
          : "text-madoo-ink-muted hover:text-madoo-ink",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function ExportProviderCard({
  badge,
  busy,
  disabled,
  iconSrc,
  name,
  onClick,
}: {
  badge?: string;
  busy?: boolean;
  disabled?: boolean;
  iconSrc: string;
  name: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="relative flex min-h-18 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-madoo-border transition hover:bg-madoo-surface disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || busy}
      onClick={onClick}
      type="button"
    >
      {badge ? (
        <span className="absolute right-2.5 top-2.5 text-madoo-accent">
          <HugeiconsIcon
            aria-hidden="true"
            icon={Download01Icon}
            primaryColor="currentColor"
            size={15}
            strokeWidth={1.7}
          />
        </span>
      ) : null}
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-madoo-surface">
        <img
          alt=""
          className="size-6 object-contain"
          loading="lazy"
          src={iconSrc}
        />
      </span>
      <span className="min-w-0 truncate text-sm font-medium text-madoo-ink">
        {busy ? "Working…" : name}
      </span>
    </button>
  );
}

function ExportFileCard({
  busy,
  description,
  disabled,
  icon,
  name,
  onClick,
}: {
  busy?: boolean;
  description: string;
  disabled?: boolean;
  icon: IconSvgElement;
  name: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex min-h-18 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-madoo-border transition hover:bg-madoo-surface disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || busy}
      onClick={onClick}
      type="button"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-madoo-ink text-white">
        <HugeiconsIcon
          aria-hidden="true"
          icon={icon}
          primaryColor="currentColor"
          size={18}
          strokeWidth={1.7}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-madoo-ink">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-madoo-ink-muted">
          {busy ? "Working…" : description}
        </span>
      </span>
    </button>
  );
}

/** Trigger a browser download for an authenticated proxy URL. */
function triggerDownload(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Open the provider OAuth consent popup and resolve when it reports back. */
function openConnectPopup(
  provider: ConnectionProvider,
  url: string,
): Promise<{ ok: boolean; message?: string | null }> {
  return new Promise((resolve) => {
    const popup = window.open(
      url,
      `madoo-connect-${provider}`,
      "width=520,height=680",
    );
    if (!popup) {
      resolve({ ok: false, message: "Popup blocked. Allow popups and retry." });
      return;
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as
        | { type?: string; provider?: string; ok?: boolean; message?: string | null }
        | undefined;
      if (data?.type !== "madoo:connection" || data.provider !== provider) return;
      cleanup();
      resolve({ ok: Boolean(data.ok), message: data.message });
    };
    const timer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        resolve({ ok: false, message: "Connection window closed." });
      }
    }, 500);
    function cleanup() {
      window.clearInterval(timer);
      window.removeEventListener("message", onMessage);
      try {
        popup?.close();
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("message", onMessage);
  });
}

function ExportProviderModal({
  emailId,
  open,
  onClose,
  variantId,
}: {
  emailId: string | null;
  open: boolean;
  onClose: () => void;
  variantId: string | null;
}) {
  const [tab, setTab] = useState<ExportTab>("application");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ["connections"],
    queryFn: fetchConnections,
    enabled: open,
  });
  const isConnected = (provider: ConnectionProvider) =>
    connectionsQuery.data?.some((c) => c.provider === provider) ?? false;

  const variantQuery = variantId
    ? `&variantId=${encodeURIComponent(variantId)}`
    : "";

  const requireEmail = (): string | null => {
    if (!emailId) {
      toast({
        tone: "danger",
        title: "No email yet",
        body: "Generate an email before exporting.",
      });
      return null;
    }
    return emailId;
  };

  const downloadFile = (kind: string, extraQuery = "") => {
    const id = requireEmail();
    if (!id) return;
    triggerDownload(
      `/api/export/emails/${id}/export/${kind}?${extraQuery}${variantQuery}`.replace(
        "?&",
        "?",
      ),
    );
  };

  const handleEsp = (displayName: string) => {
    const provider = ESP_NAME_TO_PROVIDER[displayName];
    if (!provider) return;
    const id = requireEmail();
    if (!id) return;
    triggerDownload(
      `/api/export/emails/${id}/export/esp?provider=${provider}${variantQuery}`,
    );
    toast({
      tone: "success",
      title: `${displayName} HTML downloaded`,
      body: ESP_INSTRUCTIONS[provider].join(" "),
    });
  };

  const handlePayload = (displayName: string) => {
    const id = requireEmail();
    if (!id) return;
    triggerDownload(
      `/api/export/emails/${id}/export/payload?${variantQuery}`.replace("?&", "?"),
    );
    const steps = AUTOMATION_INSTRUCTIONS[displayName];
    toast({
      tone: "success",
      title: `${displayName} payload downloaded`,
      body: steps ? steps.join(" ") : "JSON payload downloaded.",
    });
  };

  const ensureConnected = async (
    provider: ConnectionProvider,
  ): Promise<boolean> => {
    if (isConnected(provider)) return true;
    const { url } = await getConnectionAuthorizeUrl(provider);
    const result = await openConnectPopup(provider, url);
    if (!result.ok) {
      toast({
        tone: "danger",
        title: "Connection failed",
        body: result.message ?? "Could not connect the account.",
      });
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: ["connections"] });
    return true;
  };

  const handleDraft = async (
    displayName: string,
    provider: ConnectionProvider,
  ) => {
    const id = requireEmail();
    if (!id) return;
    setBusyKey(displayName);
    try {
      const ok = await ensureConnected(provider);
      if (!ok) return;
      const result =
        provider === "gmail"
          ? await createGmailDraft(id, variantId ?? undefined)
          : await createOutlookDraft(id, variantId ?? undefined);
      window.open(result.openUrl, "_blank", "noopener");
      toast({
        tone: "success",
        title: `${displayName} draft created`,
        body: "Opened your drafts in a new tab to review and send.",
      });
    } catch (error) {
      toast({
        tone: "danger",
        title: `${displayName} export failed`,
        body:
          error instanceof Error ? error.message : "Could not create the draft.",
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleApplication = (displayName: string) => {
    if (displayName === "Gmail") return handleDraft("Gmail", "gmail");
    if (displayName === "Outlook App" || displayName === "Outlook Web") {
      return handleDraft(displayName, "outlook");
    }
    return handlePayload(displayName);
  };

  return (
    <Modal
      className="bg-madoo-bg"
      description="Choose where this generated email should go next."
      eyebrow="Export"
      onClose={onClose}
      open={open}
      size="lg"
      title="Export email"
    >
      <div className="space-y-4">
        <div className="flex w-fit items-center rounded-xl bg-madoo-surface-2 p-1">
          {/* Providers export is hidden until ESP integrations are available.
          <ExportTabButton active={tab === "email"} onClick={() => setTab("email")}>
            Providers
          </ExportTabButton>
          */}
          <ExportTabButton
            active={tab === "application"}
            onClick={() => setTab("application")}
          >
            Application
          </ExportTabButton>
          <ExportTabButton active={tab === "file"} onClick={() => setTab("file")}>
            File
          </ExportTabButton>
        </div>

        <div className="grid max-h-90 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {/* Providers export is hidden until ESP integrations are available.
          {tab === "email"
            ? emailExportProviders.map((provider) => (
                <ExportProviderCard
                  iconSrc={provider.iconSrc}
                  key={provider.name}
                  name={provider.name}
                  onClick={() => handleEsp(provider.name)}
                />
              ))
            : null}
          */}

          {tab === "application"
            ? applicationExportProviders.map((provider) => (
                <ExportProviderCard
                  badge={provider.badge}
                  busy={busyKey === provider.name}
                  iconSrc={provider.iconSrc}
                  key={provider.name}
                  name={provider.name}
                  onClick={() => handleApplication(provider.name)}
                />
              ))
            : null}

          {tab === "file"
            ? fileExportFormats.map((format) => {
                if (format.name === "AMPHTML") {
                  return (
                    <ExportFileCard
                      description="Coming soon"
                      disabled
                      icon={format.icon}
                      key={format.name}
                      name={format.name}
                    />
                  );
                }
                const onClick =
                  format.name === "HTML"
                    ? () => downloadFile("html")
                    : format.name === "Image"
                      ? () => downloadFile("image", "format=png")
                      : () => downloadFile("pdf");
                return (
                  <ExportFileCard
                    description={format.description}
                    icon={format.icon}
                    key={format.name}
                    name={format.name}
                    onClick={onClick}
                  />
                );
              })
            : null}
        </div>
      </div>
    </Modal>
  );
}

function EmailPreviewSidebar({
  expanded,
  email,
  emailId,
  mode,
  onOpenExport,
  onOpenPreview,
  onOpenPricing,
  onOpenTesting,
  onToggleExpanded,
  open,
  setMode,
  srcDoc,
  setTheme,
  setWidth,
  subject,
  theme,
  width,
}: {
  expanded: boolean;
  email: EmailDto | null | undefined;
  emailId: string | null;
  mode: PreviewMode;
  onOpenExport: () => void;
  onOpenPreview: () => void;
  onOpenPricing: () => void;
  onOpenTesting: () => void;
  onToggleExpanded: () => void;
  open: boolean;
  setMode: (mode: PreviewMode) => void;
  srcDoc: string;
  setTheme: (theme: TemplateTheme) => void;
  setWidth: (width: number) => void;
  subject: string;
  theme: TemplateTheme;
  width: number;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(900);

  const syncIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    const documentElement = iframe?.contentDocument?.documentElement;
    const body = iframe?.contentDocument?.body;

    if (!documentElement || !body) return;

    setIframeHeight(
      Math.max(documentElement.scrollHeight, body.scrollHeight, 640),
    );
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(syncIframeHeight);
    return () => window.cancelAnimationFrame(frame);
  }, [mode, srcDoc, syncIframeHeight, theme, width]);

  const handleResizePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);

    const updateWidth = (clientX: number) => {
      const nextWidth =
        ((window.innerWidth - clientX) / window.innerWidth) * 100;
      setWidth(clampPreviewWidth(nextWidth));
    };

    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      updateWidth(moveEvent.clientX);
    };

    const onPointerUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    updateWidth(event.clientX);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
    window.addEventListener("pointercancel", onPointerUp, { once: true });
  };

  return (
    <aside
      aria-label="Email template preview"
      className={cn(
        "min-h-0 shrink-0 overflow-hidden bg-white ease-out",
        expanded ? "absolute inset-y-0 right-0 z-20" : "relative",
        isResizing
          ? "transition-[opacity,transform]"
          : "transition-[width,opacity,transform] duration-300",
        open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
      )}
      style={{
        maxWidth: open
          ? expanded
            ? "100vw"
            : "calc(100vw - 320px)"
          : 0,
        minWidth: open
          ? expanded
            ? "100vw"
            : "min(560px, 58vw)"
          : 0,
        width: open
          ? expanded
            ? "100vw"
            : `${width}vw`
          : 0,
      }}
    >
      {open ? (
        <button
          aria-label="Resize email preview"
          className="group absolute inset-y-0 left-0 z-30 w-3 cursor-col-resize touch-none bg-transparent outline-none"
          onDoubleClick={() => setWidth(defaultPreviewWidthVw)}
          onPointerDown={handleResizePointerDown}
          type="button"
        >
          <span
            className={cn(
              "absolute inset-y-0 left-0 w-0.75 bg-madoo-accent opacity-0 transition-opacity",
              "group-hover:opacity-100 group-focus-visible:opacity-100",
              isResizing && "opacity-100",
            )}
          />
        </button>
      ) : null}

      <div className="flex h-full min-w-105 flex-col">
        <div className="shrink-0 bg-[#F2F2F2] rounded-t-3xl">
          <div className="flex min-h-13 items-center gap-3 bg-white px-4">
            <Button
              aria-label={
                expanded ? "Collapse email preview" : "Expand email preview"
              }
              className="size-9 shrink-0 rounded-lg"
              onClick={onToggleExpanded}
              size="sm"
              type="button"
              variant="ghost"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={expanded ? PanelRightIcon : PanelLeftIcon}
                primaryColor="currentColor"
                size={21}
                strokeWidth={1.55}
              />
            </Button>

            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-madoo-ink">
                {subject}
              </h2>
              <p className="flex min-w-0 items-center gap-1.5 truncate text-xs text-madoo-ink-muted">
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={SparklesIcon}
                  primaryColor="currentColor"
                  size={13}
                  strokeWidth={1.55}
                />
                <span className="truncate">AI suggested subject</span>
              </p>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <ShareProjectDropdown email={email} emailId={emailId} />
              <HeaderPillButton
                className="bg-white text-[#101114] hover:bg-[#f3f4f6]"
                label="Preview email"
                leftIcon={EyeIcon}
                onClick={onOpenPreview}
              >
                Preview
              </HeaderPillButton>
              <HeaderPillButton
                className="text-white shadow-none"
                label="Upgrade exports"
                leftIcon={CrownPlusIcon}
                onClick={onOpenPricing}
                style={{ backgroundColor: "#101114", color: "#ffffff" }}
              >
                Upgrade
              </HeaderPillButton>
              <HeaderPillButton
                className="text-white shadow-none"
                label="Test email"
                leftIcon={TestTube02Icon}
                onClick={onOpenTesting}
                style={{ backgroundColor: "#16a34a", color: "#ffffff" }}
              >
                Test
              </HeaderPillButton>
              <HeaderPillButton
                className="text-white shadow-none"
                label="Export email"
                leftIcon={FileExportIcon}
                onClick={onOpenExport}
                style={{ backgroundColor: "#356bff", color: "#ffffff" }}
              >
                Export
              </HeaderPillButton>
            </div>
          </div>

          <div className="flex min-h-11 items-center justify-end gap-2 px-4">
            <SegmentedControl
              aria-label="Preview mode"
              className="rounded-lg bg-madoo-surface p-1 shadow-none"
              items={previewModeItems}
              onChange={(value) => setMode(value as PreviewMode)}
              value={mode}
            />

            <Button
              aria-label={`Use ${theme === "light" ? "dark" : "light"} email theme`}
              className="h-8 gap-2 rounded-lg bg-white px-3 text-xs font-medium text-madoo-ink shadow-madoo-border hover:bg-[#f3f4f6]"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              size="sm"
              variant="ghost"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={theme === "light" ? Moon02Icon : Sun01Icon}
                primaryColor="currentColor"
                size={15}
                strokeWidth={1.55}
              />
              <span>{theme === "light" ? "Dark" : "Light"}</span>
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden shadow-madoo-border">
          <div className="madoo-preview-scrollbar mr-1 h-full overflow-y-auto">
            <div
              className={cn(
                "mx-auto overflow-hidden shadow-[0_18px_44px_rgb(var(--ink-shadow-rgb)/0.14)] transition-[width] duration-300",
                mode === "desktop" ? "w-full" : "w-97.5",
              )}
            >
              <iframe
                className={cn(
                  "block w-full border-0 bg-white",
                  isResizing && "pointer-events-none",
                )}
                onLoad={syncIframeHeight}
                ref={iframeRef}
                scrolling="no"
                sandbox=""
                srcDoc={srcDoc}
                style={{ height: iframeHeight }}
                title="Generated email template preview"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function HumanMessage({ children }: { children: string }) {
  return (
    <div className="ml-auto">
      <pre className="max-w-xl whitespace-pre-wrap wrap-break-word rounded-lg bg-madoo-bg px-4 py-2 font-figtree shadow-madoo-border">
        {children}
      </pre>

      <div className="flex gap-1 my-1.5 mt-3 max-w-min ml-auto">
        <ActionButton icon={Edit02Icon} label="Edit message" />
        <ActionButton
          icon={Copy01Icon}
          label="Copy message"
          onClick={() => copyText(children)}
        />
      </div>
    </div>
  );
}

function AiMessage({
  children,
  onOpenPreview,
}: {
  children: string;
  onOpenPreview?: () => void;
}) {
  return (
    <div className="rounded mr-auto text-left">
      <Streamdown className="ai-conversation-markdown font-figtree leading-6">
        {children}
      </Streamdown>

      <div className="flex gap-1 mt-1.5">
        <ActionButton
          icon={Copy01Icon}
          label="Copy response"
          onClick={() => copyText(children)}
        />
        <ActionButton icon={ThumbsUpIcon} label="Like response" />
        <ActionButton icon={ThumbsDownIcon} label="Dislike response" />
        <ActionButton
          icon={RefreshIcon}
          label="Regenerate response"
          onClick={onOpenPreview}
        />
      </div>
    </div>
  );
}

function StatusMessage({ children }: { children: string }) {
  return (
    <div className="mr-auto max-w-xl rounded-lg bg-madoo-surface-2 px-3 py-2 text-xs text-madoo-ink-muted shadow-madoo-border">
      {children}
    </div>
  );
}

function ErrorMessage({ children }: { children: string }) {
  return (
    <div className="mr-auto max-w-xl rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow-madoo-border">
      {children}
    </div>
  );
}

export default function EmailTemplateProject() {
  const messagesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const sidebarOpen = useClientStore((state) => state.sidebarOpen);
  const setSidebarOpen = useClientStore((state) => state.setSidebarOpen);
  const [currentEmailId, setCurrentEmailId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    mapChatMessages(undefined, null),
  );
  const [streamedHtml, setStreamedHtml] = useState<string | null>(null);
  const [streamedSubject, setStreamedSubject] = useState<string | null>(null);
  const [streamedConversationTitle, setStreamedConversationTitle] = useState<
    string | null
  >(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [testingModalOpen, setTestingModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [templateTheme, setTemplateTheme] = useState<TemplateTheme>("light");
  const [previewWidth, setPreviewWidth] = useState(defaultPreviewWidthVw);
  const [previewWidthBeforeExpand, setPreviewWidthBeforeExpand] = useState(
    defaultPreviewWidthVw,
  );
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [previewOverlayOpen, setPreviewOverlayOpen] = useState(false);
  const processedStartupRef = useRef<string | null>(null);

  const emailQuery = useQuery({
    queryKey: ["email", currentEmailId],
    queryFn: () => fetchEmail(currentEmailId!),
    enabled: Boolean(currentEmailId),
  });
  const chatQuery = useQuery({
    queryKey: ["email-chat", currentEmailId],
    queryFn: () => fetchEmailChat(currentEmailId!),
    enabled: Boolean(currentEmailId),
  });

  const email = emailQuery.data;
  const variant = latestVariant(email);
  const previewSrcDoc = streamedHtml ?? variant?.compiledHtml ?? null;
  const hasPreview = Boolean(previewSrcDoc);
  const previewSubject =
    streamedSubject ?? variant?.subject ?? "Untitled email";
  const storedConversationTitle =
    email?.title && email.title !== variant?.subject ? email.title : null;
  const conversationTitle =
    streamedConversationTitle ??
    storedConversationTitle ??
    deriveConversationTitle(messages, "New conversation");
  const startupKey = useMemo(() => searchParams.toString(), [searchParams]);

  const invalidateEmailState = useCallback(
    async (emailId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["email", emailId] }),
        queryClient.invalidateQueries({ queryKey: ["email-chat", emailId] }),
        queryClient.invalidateQueries({ queryKey: ["emails"] }),
        queryClient.invalidateQueries({ queryKey: ["billing-overview"] }),
      ]);
    },
    [queryClient],
  );

  const startStream = useCallback(
    async (
      emailId: string,
      mode: "generate" | "edit",
      instruction?: string,
      baseVariantId?: string,
    ) => {
      const statusId = `${mode}-${Date.now()}-status`;
      const assistantId = `${mode}-${Date.now()}-assistant`;
      let assistantText = "";

      setIsStreaming(true);
      setMessages((current) =>
        upsertMessage(current, {
          id: statusId,
          role: "status",
          content:
            mode === "generate"
              ? "Starting generation..."
              : "Applying edits...",
        }),
      );

      const handleEvent = (event: StreamEmailEvent) => {
        if (event.type === "step") {
          setMessages((current) =>
            upsertMessage(current, {
              id: statusId,
              role: "status",
              content: event.message,
            }),
          );
          return;
        }

        if (event.type === "assistant-chunk") {
          assistantText += event.value;
          setMessages((current) =>
            upsertMessage(current, {
              id: assistantId,
              role: "assistant",
              content: assistantText,
            }),
          );
          return;
        }

        if (event.type === "subject") {
          setStreamedSubject(event.value);
          return;
        }

        if (event.type === "conversation_title") {
          setStreamedConversationTitle(event.value);
          return;
        }

        if (event.type === "code-chunk") {
          setMessages((current) =>
            upsertMessage(current, {
              id: statusId,
              role: "status",
              content: "Updating email template...",
            }),
          );
          return;
        }

        if (event.type === "done") {
          playCompletionSound();
          if (event.compiledHtml) {
            setStreamedHtml(event.compiledHtml);
            setSidebarOpen(true);
          }
          if (event.subject) setStreamedSubject(event.subject);
          if (event.conversationTitle) {
            setStreamedConversationTitle(event.conversationTitle);
          }
          if (!assistantText.trim()) {
            setMessages((current) =>
              upsertMessage(current, {
                id: assistantId,
                role: "assistant",
                content: event.chatOnly
                  ? "I added guidance to the conversation."
                  : `Generated email${event.subject ? `: ${event.subject}` : "."}`,
              }),
            );
          }
          setMessages((current) =>
            current.filter((message) => message.id !== statusId),
          );
          return;
        }

        if (event.type === "error") {
          setMessages((current) =>
            upsertMessage(
              current.filter((message) => message.id !== statusId),
              {
                id: `${mode}-${Date.now()}-error`,
                role: "error",
                content: event.message,
              },
            ),
          );
        }
      };

      try {
        await consumeEmailSseStream(
          `/api/emails/${emailId}/${mode}`,
          handleEvent,
          undefined,
          mode === "edit"
            ? JSON.stringify({
                instruction: instruction ?? "",
                ...(baseVariantId ? { baseVariantId } : {}),
              })
            : undefined,
        );
        await invalidateEmailState(emailId);
      } catch (error) {
        setMessages((current) =>
          upsertMessage(
            current.filter((message) => message.id !== statusId),
            {
              id: `${mode}-${Date.now()}-error`,
              role: "error",
              content:
                error instanceof Error ? error.message : "Email stream failed.",
            },
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [invalidateEmailState, setSidebarOpen],
  );

  const submitChatPrompt = useCallback(
    async (input: PromptSubmitInput) => {
      if (isStreaming) return;
      setMessages((current) => [
        ...current,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: input.prompt,
        },
      ]);

      if (currentEmailId) {
        await startStream(currentEmailId, "edit", input.prompt, variant?.id);
        return;
      }

      try {
        const created = await createEmail({
          prompt: input.prompt,
          tone: input.tone,
          length: input.length,
          audience: input.audience,
        });
        setCurrentEmailId(created.id);
        router.replace(`/email-template-project?id=${created.id}`);
        await startStream(created.id, "generate");
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: `create-${Date.now()}-error`,
            role: "error",
            content:
              error instanceof Error
                ? error.message
                : "Could not create email project.",
          },
        ]);
      }
    },
    [currentEmailId, isStreaming, router, startStream, variant?.id],
  );

  const updateScrollState = useCallback(() => {
    const messages = messagesRef.current;

    if (!messages) return;

    setCanScrollDown(
      messages.scrollTop + messages.clientHeight < messages.scrollHeight - 24,
    );
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  useEffect(() => {
    if (!currentEmailId || email?.status !== "GENERATING" || isStreaming) {
      return;
    }
    const interval = window.setInterval(() => {
      void emailQuery.refetch();
      void chatQuery.refetch();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [chatQuery, currentEmailId, email?.status, emailQuery, isStreaming]);

  useEffect(() => {
    setStreamedHtml(null);
    setStreamedSubject(null);
    setStreamedConversationTitle(null);
  }, [currentEmailId]);

  useEffect(() => {
    if (isStreaming) return;
    setMessages(mapChatMessages(chatQuery.data, email));
  }, [chatQuery.data, email, isStreaming]);

  useEffect(() => {
    if (hasPreview) {
      setSidebarOpen(true);
      return;
    }
    setSidebarOpen(false);
    setPreviewExpanded(false);
  }, [hasPreview, setSidebarOpen]);

  useEffect(() => {
    if (!startupKey || processedStartupRef.current === startupKey) return;
    processedStartupRef.current = startupKey;

    const id = searchParams.get("id");
    if (id) {
      setCurrentEmailId(id);
      return;
    }

    const pendingPromptId = searchParams.get("pendingPromptId");
    if (pendingPromptId) {
      setMessages([
        {
          id: "pending-status",
          role: "status",
          content: "Loading your saved prompt...",
        },
      ]);
      void consumePendingPrompt(pendingPromptId)
        .then(async (pendingPrompt) => {
          if (!pendingPrompt.emailId) {
            throw new Error("Pending prompt did not create an email.");
          }
          setCurrentEmailId(pendingPrompt.emailId);
          router.replace(`/email-template-project?id=${pendingPrompt.emailId}`);
          setMessages([
            {
              id: `${pendingPrompt.emailId}-prompt`,
              role: "user",
              content: pendingPrompt.prompt,
            },
            {
              id: `${pendingPrompt.emailId}-status`,
              role: "status",
              content: "Generation is running...",
            },
          ]);
          await invalidateEmailState(pendingPrompt.emailId);
        })
        .catch((error) => {
          setMessages([
            {
              id: "pending-error",
              role: "error",
              content:
                error instanceof Error
                  ? error.message
                  : "Could not load pending prompt.",
            },
          ]);
        });
      return;
    }

    const prompt = searchParams.get("prompt")?.trim();
    if (!prompt) return;

    const tone = searchParams.get("tone") ?? undefined;
    const length = searchParams.get("length") ?? undefined;
    const audience = searchParams.get("audience") ?? undefined;

    setMessages([{ id: "new-prompt", role: "user", content: prompt }]);
    void createEmail({ prompt, tone, length, audience })
      .then(async (created) => {
        setCurrentEmailId(created.id);
        router.replace(`/email-template-project?id=${created.id}`);
        await startStream(created.id, "generate");
      })
      .catch((error) => {
        setMessages((current) => [
          ...current,
          {
            id: "create-error",
            role: "error",
            content:
              error instanceof Error
                ? error.message
                : "Could not create email project.",
          },
        ]);
      });
  }, [
    invalidateEmailState,
    router,
    searchParams,
    startStream,
    startupKey,
  ]);

  const scrollToBottom = () => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const updatePreviewWidth = (width: number) => {
    setPreviewExpanded(false);
    setPreviewWidth(width);
  };

  const togglePreviewExpanded = () => {
    if (previewExpanded) {
      setPreviewWidth(previewWidthBeforeExpand);
      setPreviewExpanded(false);
      return;
    }

    setPreviewWidthBeforeExpand(previewWidth);
    setPreviewExpanded(true);
  };

  const openStandalonePreview = useCallback(() => {
    if (!previewSrcDoc) {
      toast({
        tone: "danger",
        title: "No preview yet",
        body: "Generate an email before opening the preview.",
      });
      return;
    }

    const blob = new Blob([previewSrcDoc], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, "_blank");
    if (!previewWindow) {
      URL.revokeObjectURL(url);
      toast({
        tone: "danger",
        title: "Preview blocked",
        body: "Allow popups for Madoo and try again.",
      });
      return;
    }
    previewWindow.opener = null;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [previewSrcDoc, toast]);

  return (
    <main className="relative h-screen overflow-hidden bg-white">
      <header
        className={cn(
          "fixed left-3 top-0 z-30 flex h-11 w-fit items-center bg-white transition-[opacity,transform]",
          hasPreview &&
            previewExpanded &&
            "pointer-events-none -translate-y-3 opacity-0",
        )}
      >
        <ConversationTitleDropdown title={conversationTitle} />
      </header>

      <div className="flex h-full min-h-0 overflow-hidden">
        {/* CHAT SECTION, (User messages, AI agent messages, date at the top, and so on...) */}
        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col pb-4 pt-11 transition-opacity",
            hasPreview && previewExpanded && "pointer-events-none opacity-0",
          )}
        >
          {/* messages */}
          <div
            ref={messagesRef}
            className="madoo-chat-scrollbar min-h-0 flex-1 overflow-y-auto pr-4 text-sm font-figtree pb-48"
            onScroll={updateScrollState}
          >
            <div className="mx-auto w-full max-w-2xl px-4">
              <div className="mt-8 flex flex-col gap-8">
                {messages.map((message) => {
                  if (message.role === "user") {
                    return (
                      <HumanMessage key={message.id}>
                        {message.content}
                      </HumanMessage>
                    );
                  }
                  if (message.role === "error") {
                    return (
                      <ErrorMessage key={message.id}>
                        {message.content}
                      </ErrorMessage>
                    );
                  }
                  if (message.role === "status") {
                    return (
                      <StatusMessage key={message.id}>
                        {message.content}
                      </StatusMessage>
                    );
                  }
                  return (
                    <AiMessage
                      key={message.id}
                      onOpenPreview={() => {
                        if (hasPreview) setSidebarOpen(true);
                      }}
                    >
                      {message.content}
                    </AiMessage>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-176 shrink-0 px-4">
            <div className="pointer-events-none absolute inset-x-4 -top-4 h-4 bg-linear-to-b from-white/0 via-white/80 to-white" />
            {canScrollDown ? (
              <Button
                aria-label="Scroll to latest message"
                className="absolute left-1/2 top-0 z-10 h-9 w-9 -translate-x-1/2 translate-y-[-150%] shadow-madoo-border rounded-full bg-white text-madoo-ink hover:bg-madoo-bg"
                onClick={scrollToBottom}
                size="sm"
                variant="icon"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ArrowDown02Icon}
                  primaryColor="currentColor"
                  size={18}
                  strokeWidth={1.6}
                />
              </Button>
            ) : null}
            <ClientPromptBox
              classNames={{
                root: "w-full",
                panel: "bg-madoo-bg shadow-[inset_0_0_0_0.75px_rgb(var(--ink-shadow-rgb)/0.18)]",
                textarea: "min-h-17 rounded-t-2xl px-4.5 pt-4.25",
              }}
              disabled={isStreaming}
              onSubmit={submitChatPrompt}
              showOptions={false}
              variant="chat"
            />
          </div>
        </section>

        {hasPreview && previewSrcDoc ? (
          <EmailPreviewSidebar
            email={email}
            emailId={currentEmailId}
            expanded={previewExpanded}
            mode={previewMode}
            onOpenExport={() => setExportModalOpen(true)}
            onOpenPreview={() => setPreviewOverlayOpen(true)}
            onOpenPricing={() => setPricingOpen(true)}
            onOpenTesting={() => setTestingModalOpen(true)}
            onToggleExpanded={togglePreviewExpanded}
            open={sidebarOpen}
            setMode={setPreviewMode}
            srcDoc={previewSrcDoc}
            setTheme={setTemplateTheme}
            setWidth={updatePreviewWidth}
            subject={previewSubject}
            theme={templateTheme}
            width={previewWidth}
          />
        ) : null}
      </div>

      <PreviewOverlay
        onClose={() => setPreviewOverlayOpen(false)}
        onOpenInNewTab={openStandalonePreview}
        open={previewOverlayOpen && Boolean(previewSrcDoc)}
        srcDoc={previewSrcDoc ?? ""}
        subject={previewSubject}
      />

      <ExportProviderModal
        emailId={currentEmailId}
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
        variantId={variant?.id ?? null}
      />
      <PricingDrawer
        onClose={() => setPricingOpen(false)}
        open={pricingOpen}
      />
      <TestingModal
        emailId={currentEmailId}
        html={previewSrcDoc ?? ""}
        onClose={() => setTestingModalOpen(false)}
        open={testingModalOpen}
        variantId={variant?.id ?? null}
      />
    </main>
  );
}
