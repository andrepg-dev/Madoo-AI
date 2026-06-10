"use client";

import { ClientPromptBox } from "@/components/home/ClientPromptBox";
import {
  ArrowDown01Icon,
  ArrowDown02Icon,
  Copy01Icon,
  Download01Icon,
  Edit02Icon,
  LaptopIcon,
  Moon02Icon,
  RefreshIcon,
  SendToMobileIcon,
  SourceCodeIcon,
  Sun01Icon,
  TestTubeIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/stores/client-store";
import { Button } from "@madoo/design-system";
import Image from "next/image";
import {
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

const minPreviewWidthVw = 52;
const defaultPreviewWidthVw = 64;
const maxPreviewWidthVw = 78;

function clampPreviewWidth(width: number) {
  return Math.min(maxPreviewWidthVw, Math.max(minPreviewWidthVw, width));
}

function copyText(text: string) {
  void navigator.clipboard?.writeText(text);
}

function HeaderActionButton({
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
      className="h-8 gap-2 rounded-lg px-3 text-xs font-medium text-madoo-ink hover:bg-madoo-bg"
      onClick={onClick}
      size="sm"
      variant="ghost"
    >
      <HugeiconsIcon
        aria-hidden="true"
        icon={icon}
        primaryColor="currentColor"
        size={15}
        strokeWidth={1.55}
      />
      <span className="max-sm:hidden">{label}</span>
    </Button>
  );
}

function PreviewSegmentButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: IconSvgElement;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 text-xs font-medium transition",
        active
          ? "bg-white text-madoo-ink shadow-madoo-border"
          : "text-madoo-ink-muted hover:bg-white/70 hover:text-madoo-ink",
      )}
      onClick={onClick}
      type="button"
    >
      <HugeiconsIcon
        aria-hidden="true"
        icon={icon}
        primaryColor="currentColor"
        size={14}
        strokeWidth={1.55}
      />
      <span>{label}</span>
    </button>
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
      body { margin: 0; background: ${pageBg}; font-family: Arial, sans-serif; color: ${text}; }
      .wrap { width: 100%; padding: 32px 12px; box-sizing: border-box; }
      .email { max-width: 640px; margin: 0 auto; overflow: hidden; border-radius: 18px; background: ${cardBg}; box-shadow: 0 24px 70px rgba(16,17,20,0.12); }
      .hero { padding: 38px 36px 30px; background: linear-gradient(135deg, ${accent}, ${dark ? "#202637" : "#eef5ff"}); color: ${dark ? "#07111f" : "#ffffff"}; }
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
        .email { border-radius: 0; }
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

function EmailPreviewSidebar({
  mode,
  open,
  setMode,
  setTheme,
  setWidth,
  theme,
  width,
}: {
  mode: PreviewMode;
  open: boolean;
  setMode: (mode: PreviewMode) => void;
  setTheme: (theme: TemplateTheme) => void;
  setWidth: (width: number) => void;
  theme: TemplateTheme;
  width: number;
}) {
  const [isResizing, setIsResizing] = useState(false);

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
        "relative min-h-0 shrink-0 overflow-hidden border-l border-madoo-border bg-madoo-bg transition-[width,opacity,transform] duration-300 ease-out",
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
          className="absolute inset-y-0 left-0 z-30 flex w-3 cursor-col-resize touch-none items-center justify-center bg-transparent outline-none transition hover:bg-madoo-accent/20 focus-visible:bg-madoo-accent/25"
          onPointerDown={handleResizePointerDown}
          type="button"
        >
          <span className="h-12 w-1 rounded-full bg-madoo-border" />
        </button>
      ) : null}

      <div className="flex h-full min-w-[420px] flex-col pl-3">
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-madoo-border px-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-madoo-ink">
              Email preview
            </h2>
            <p className="truncate text-xs text-madoo-ink-muted">
              Live generated template
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <HeaderActionButton icon={Download01Icon} label="Export" />
              <HeaderActionButton icon={SourceCodeIcon} label="Show code" />
              <HeaderActionButton icon={TestTubeIcon} label="Test" />
            </div>

            <div className="inline-flex rounded-lg bg-madoo-surface p-1">
              <PreviewSegmentButton
                active={mode === "desktop"}
                icon={LaptopIcon}
                label="Desktop"
                onClick={() => setMode("desktop")}
              />
              <PreviewSegmentButton
                active={mode === "responsive"}
                icon={SendToMobileIcon}
                label="Responsive"
                onClick={() => setMode("responsive")}
              />
            </div>

            <Button
              aria-label={`Use ${theme === "light" ? "dark" : "light"} email theme`}
              className="h-8 w-8 rounded-lg bg-white text-madoo-ink shadow-madoo-border hover:bg-madoo-surface"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              size="sm"
              variant="icon"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={theme === "light" ? Moon02Icon : Sun01Icon}
                primaryColor="currentColor"
                size={15}
                strokeWidth={1.55}
              />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4">
          <div
            className={cn(
              "mx-auto h-full min-h-[640px] overflow-hidden rounded-xl bg-white shadow-[0_18px_44px_rgb(var(--ink-shadow-rgb)_/_0.14)] transition-[width] duration-300",
              mode === "desktop" ? "w-full" : "w-[390px]",
            )}
          >
            <iframe
              className={cn(
                "h-full w-full border-0 bg-white",
                isResizing && "pointer-events-none",
              )}
              sandbox=""
              srcDoc={getEmailTemplateSrcDoc(theme)}
              title="Generated email template preview"
            />
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

          <div className="relative mx-auto w-full max-w-2xl shrink-0">
            <div className="pointer-events-none absolute inset-x-0 -top-4 h-4 bg-gradient-to-b from-white/0 via-white/80 to-white" />
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
          open={sidebarOpen}
          setMode={setPreviewMode}
          setTheme={setTemplateTheme}
          setWidth={setPreviewWidth}
          theme={templateTheme}
          width={previewWidth}
        />
      </div>
    </main>
  );
}
