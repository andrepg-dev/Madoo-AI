"use client";

import { ClientPromptBox } from "@/components/home/ClientPromptBox";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/stores/client-store";
import {
  ArrowDown01Icon,
  ArrowDown02Icon,
  Copy01Icon,
  Download01Icon,
  Edit02Icon,
  Moon02Icon,
  RefreshIcon,
  SparklesIcon,
  SourceCodeIcon,
  Sun01Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Button, Modal, SegmentedControl } from "@madoo/design-system";
import Image from "next/image";
import {
  type CSSProperties,
  type PointerEvent,
  useCallback,
  useEffect,
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

const userGreeting = "Hi madoo, how are you?";

const aiGreeting = `¡Hola! Todo bien por aquí, ¿y tú? 😊

Estoy listo para ayudarte a crear o modificar tu aplicación web. ¿Qué te gustaría construir hoy? Por ejemplo:

- Una página de inicio o landing page
- Un blog o portafolio
- Una app con base de datos y login de usuarios
- Una tienda online

Cuéntame tu idea y empezamos. 🚀`;

const userCampaignRequest =
  "Create a polished launch email for our new AI campaign builder. Keep it concise and make the CTA feel clear.";
const suggestedEmailSubject = "Build campaigns faster with Madoo";

const aiCampaignResponse = `Here’s a sharper direction:

**Subject:** Build campaigns faster with Madoo

Hi there,

Meet Madoo, your AI workspace for turning campaign ideas into polished email templates without starting from a blank page.

- Draft launch emails in minutes
- Adjust tone and length without rewriting
- Keep brand structure consistent across campaigns

**CTA:** Start your next campaign`;

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

function getEmailTemplateSrcDoc(theme: TemplateTheme) {
  const dark = theme === "dark";
  const pageBg = dark ? "#111827" : "#f5f7fb";
  const cardBg = dark ? "#171923" : "#ffffff";
  const text = dark ? "#f9fafb" : "#101114";
  const muted = dark ? "#a8b0bd" : "#5f6673";
  const accent = dark ? "#8fd6ff" : "#356bff";
  const divider = dark ? "#2a3142" : "#e5e9f2";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html { margin: 0; overflow: hidden; }
      body { margin: 0; overflow: hidden; background: ${pageBg}; font-family: Arial, sans-serif; color: ${text}; }
      .wrap { width: 100%; padding: 32px 12px; box-sizing: border-box; }
      .email { max-width: 640px; margin: 0 auto; overflow: hidden; border-radius: 18px; background: ${cardBg}; box-shadow: 0 24px 70px rgba(16,17,20,0.12); }
      .hero { border-radius: 18px 18px 0 0; padding: 38px 36px 30px; background: linear-gradient(135deg, ${accent}, ${dark ? "#202637" : "#eef5ff"}); color: ${dark ? "#07111f" : "#ffffff"}; }
      .eyebrow { margin: 0 0 12px; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
      h1 { margin: 0; font-size: 34px; line-height: 1.04; letter-spacing: 0; }
      .body { padding: 34px 36px 38px; }
      p { margin: 0; color: ${muted}; font-size: 16px; line-height: 1.6; }
      .grid { display: grid; gap: 12px; margin: 28px 0; }
      .item { border: 1px solid ${divider}; border-radius: 14px; padding: 16px; }
      .item strong { display: block; margin-bottom: 6px; color: ${text}; font-size: 15px; }
      .cta { display: inline-block; margin-top: 4px; border-radius: 999px; background: ${accent}; color: ${dark ? "#07111f" : "#ffffff"}; padding: 13px 20px; font-size: 14px; font-weight: 700; text-decoration: none; }
      @media (max-width: 520px) {
        .wrap { padding: 0; }
        .hero, .body { padding-left: 22px; padding-right: 22px; }
        h1 { font-size: 28px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <article class="email">
        <section class="hero">
          <p class="eyebrow">Madoo AI</p>
          <h1>Build campaign emails from one focused prompt.</h1>
        </section>
        <section class="body">
          <p>Turn rough launch ideas into polished, responsive email templates your team can review, test, and export faster.</p>
          <div class="grid">
            <div class="item"><strong>Faster drafting</strong><p>Generate structure, copy, and CTA direction in seconds.</p></div>
            <div class="item"><strong>Production-ready preview</strong><p>Check responsive layout before sending work downstream.</p></div>
            <div class="item"><strong>Brand-aware output</strong><p>Keep spacing, tone, and visual hierarchy consistent.</p></div>
          </div>
          <a class="cta" href="#">Start next campaign</a>
        </section>
      </article>
    </div>
  </body>
</html>`;
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
  iconSrc,
  name,
}: {
  badge?: string;
  iconSrc: string;
  name: string;
}) {
  return (
    <button
      className="relative flex min-h-18 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-madoo-border transition hover:bg-madoo-surface"
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
        {name}
      </span>
    </button>
  );
}

function ExportFileCard({
  description,
  icon,
  name,
}: {
  description: string;
  icon: IconSvgElement;
  name: string;
}) {
  return (
    <button
      className="flex min-h-18 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-madoo-border transition hover:bg-madoo-surface"
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
          {description}
        </span>
      </span>
    </button>
  );
}

function ExportProviderModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ExportTab>("email");

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
          <ExportTabButton active={tab === "email"} onClick={() => setTab("email")}>
            Providers
          </ExportTabButton>
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

        <div className="rounded-xl bg-white p-3 shadow-madoo-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <span className="text-madoo-ink-muted">
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Download01Icon}
                  primaryColor="currentColor"
                  size={24}
                  strokeWidth={1.6}
                />
              </span>
              <span className="text-sm font-medium text-madoo-ink">
                Exports
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-madoo-ink-muted">
              <span className="hidden sm:inline">Renews Jun 20, 2026</span>
              <span className="rounded-lg bg-madoo-bg px-2.5 py-1.5 shadow-madoo-border">
                4 / 4 left
              </span>
              <Button size="sm" variant="dashed">
                Upgrade
              </Button>
            </div>
          </div>
        </div>

        <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {tab === "email"
            ? emailExportProviders.map((provider) => (
                <ExportProviderCard
                  iconSrc={provider.iconSrc}
                  key={provider.name}
                  name={provider.name}
                />
              ))
            : null}

          {tab === "application"
            ? applicationExportProviders.map((provider) => (
                <ExportProviderCard
                  badge={provider.badge}
                  iconSrc={provider.iconSrc}
                  key={provider.name}
                  name={provider.name}
                />
              ))
            : null}

          {tab === "file"
            ? fileExportFormats.map((format) => (
                <ExportFileCard
                  description={format.description}
                  icon={format.icon}
                  key={format.name}
                  name={format.name}
                />
              ))
            : null}
        </div>
      </div>
    </Modal>
  );
}

function EmailPreviewSidebar({
  mode,
  onOpenExport,
  open,
  setMode,
  setTheme,
  setWidth,
  theme,
  width,
}: {
  mode: PreviewMode;
  onOpenExport: () => void;
  open: boolean;
  setMode: (mode: PreviewMode) => void;
  setTheme: (theme: TemplateTheme) => void;
  setWidth: (width: number) => void;
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
  }, [mode, syncIframeHeight, theme, width]);

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
        "relative min-h-0 shrink-0 overflow-hidden  ease-out",
        isResizing
          ? "transition-[opacity,transform]"
          : "transition-[width,opacity,transform] duration-300",
        open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
      )}
      style={{
        maxWidth: open ? "calc(100vw - 320px)" : 0,
        minWidth: open ? "min(560px, 58vw)" : 0,
        width: open ? `${width}vw` : 0,
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
              "absolute inset-y-0 left-0 w-[3px] bg-madoo-accent opacity-0 transition-opacity",
              "group-hover:opacity-100 group-focus-visible:opacity-100",
              isResizing && "opacity-100",
            )}
          />
        </button>
      ) : null}

      <div className="flex h-full min-w-[420px] flex-col">
        <div className="shrink-0 bg-[#F2F2F2] rounded-t-3xl">
          <div className="flex min-h-13 items-center gap-3 bg-white px-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold text-madoo-ink">
                {suggestedEmailSubject}
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
              <HeaderPillButton
                className="bg-white text-[#101114] hover:bg-[#f3f4f6]"
                label="Share email"
              >
                Share
              </HeaderPillButton>
              <HeaderPillButton
                className="bg-white text-[#101114] hover:bg-[#f3f4f6]"
                label="Preview email"
              >
                Preview
              </HeaderPillButton>
              <HeaderPillButton
                className="text-white shadow-none"
                label="Upgrade exports"
                style={{ backgroundColor: "#101114", color: "#ffffff" }}
              >
                Upgrade
              </HeaderPillButton>
              <HeaderPillButton
                className="text-white shadow-none"
                label="Export email"
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
              className="h-8 gap-2 rounded-lg bg-white px-3 text-xs font-medium text-madoo-ink shadow-madoo-border hover:bg-madoo-surface"
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
                "mx-auto overflow-hidden shadow-[0_18px_44px_rgb(var(--ink-shadow-rgb)_/_0.14)] transition-[width] duration-300",
                mode === "desktop" ? "w-full" : "w-[390px]",
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
                srcDoc={getEmailTemplateSrcDoc(theme)}
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
      <pre className="max-w-xl whitespace-pre-wrap break-words rounded-lg bg-madoo-bg px-4 py-2 font-figtree shadow-madoo-border">
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

export default function EmailTemplateProject() {
  const messagesRef = useRef<HTMLDivElement>(null);
  const sidebarOpen = useClientStore((state) => state.sidebarOpen);
  const setSidebarOpen = useClientStore((state) => state.setSidebarOpen);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [templateTheme, setTemplateTheme] = useState<TemplateTheme>("light");
  const [previewWidth, setPreviewWidth] = useState(defaultPreviewWidthVw);

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
    const params = new URLSearchParams(window.location.search);
    if (params.has("prompt")) setSidebarOpen(true);
  }, [setSidebarOpen]);

  const scrollToBottom = () => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <main className="relative h-screen overflow-hidden bg-white">
      <header className="fixed left-3 top-0 z-30 flex h-11 w-fit items-center bg-white">
        <Button className="h-8 px-3 py-0!" variant="ghost">
          <Image
            src={"/madoo-transparent.png"}
            alt="Madoo AI Logo"
            width={26}
            height={26}
          />
          <div className="flex gap-2 items-center">
            <span className="font-medium">Hello friends</span>
            <HugeiconsIcon
              aria-hidden="true"
              icon={ArrowDown01Icon}
              primaryColor="currentColor"
              className="size-4 text-madoo-ink-muted"
            />
          </div>
        </Button>
      </header>

      <div className="flex h-full min-h-0 overflow-hidden">
        {/* CHAT SECTION, (User messages, AI agent messages, date at the top, and so on...) */}
        <section className="flex min-w-0 flex-1 flex-col pb-4 pt-11">
          {/* messages */}
          <div
            ref={messagesRef}
            className="madoo-chat-scrollbar min-h-0 flex-1 overflow-y-auto pr-4 text-sm font-figtree pb-48"
            onScroll={updateScrollState}
          >
            <div className="mx-auto w-full max-w-2xl px-4">
              {/* time */}
              <span className="flex w-full justify-center text-xs text-madoo-ink-muted">
                Jun 8 at 9:42 AM
              </span>

              <div className="mt-8 flex flex-col gap-8">
                {/* user message */}
                <HumanMessage>{userGreeting}</HumanMessage>
                {/* ai message */}
                <AiMessage>{aiGreeting}</AiMessage>
                <HumanMessage>{userCampaignRequest}</HumanMessage>
                <AiMessage onOpenPreview={() => setSidebarOpen(true)}>
                  {aiCampaignResponse}
                </AiMessage>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[calc(42rem+2rem)] shrink-0 px-4">
            <div className="pointer-events-none absolute inset-x-4 -top-4 h-4 bg-gradient-to-b from-white/0 via-white/80 to-white" />
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
                panel: "bg-madoo-bg shadow-[inset_0_0_0_0.75px_rgb(var(--ink-shadow-rgb)_/_0.18)]",
                textarea: "min-h-17 rounded-t-2xl px-4.5 pt-[17px]",
              }}
              showOptions={false}
              variant="chat"
            />
          </div>
        </section>

        <EmailPreviewSidebar
          mode={previewMode}
          onOpenExport={() => setExportModalOpen(true)}
          open={sidebarOpen}
          setMode={setPreviewMode}
          setTheme={setTemplateTheme}
          setWidth={setPreviewWidth}
          theme={templateTheme}
          width={previewWidth}
        />
      </div>

      <ExportProviderModal
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
      />
    </main>
  );
}
