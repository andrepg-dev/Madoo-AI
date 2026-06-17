import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { Button, SegmentedControl } from "@madoo/design-system";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownPlusIcon, EyeIcon, FileExportIcon, Moon02Icon, PanelLeftIcon, PanelRightIcon, SourceCodeIcon, SparklesIcon, Sun01Icon, TestTube02Icon } from "@hugeicons/core-free-icons";
import type { EmailDto, EmailVariantDto } from "@madoo/shared";
import { cn } from "@/lib/utils";
import { VariablesPanel } from "@/components/project/preview/VariablesPanel";
import { defaultPreviewWidthVw, previewModeItems } from "./constants";
import { clampPreviewWidth } from "./utils";
import { latestVariant } from "./chat-utils";
import type { PreviewMode, TemplateTheme } from "./types";
import { HeaderPillButton } from "./HeaderPillButton";
import { ShareProjectDropdown } from "./ShareProjectDropdown";
import { VersionsDropdown } from "./VersionsDropdown";

export function EmailPreviewSidebar({
  expanded,
  email,
  emailId,
  mode,
  onOpenExport,
  onOpenPreview,
  onOpenPricing,
  onOpenTesting,
  onSelectVersion,
  onToggleExpanded,
  open,
  setMode,
  srcDoc,
  setTheme,
  setWidth,
  subject,
  theme,
  variant,
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
  onSelectVersion: (id: string | null) => void;
  onToggleExpanded: () => void;
  open: boolean;
  setMode: (mode: PreviewMode) => void;
  srcDoc: string;
  setTheme: (theme: TemplateTheme) => void;
  setWidth: (width: number) => void;
  subject: string;
  theme: TemplateTheme;
  variant: EmailVariantDto | null;
  width: number;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(900);

  const variants = email?.variants ?? [];
  const latestVariantId = latestVariant(email)?.id;
  const canEditVariables = Boolean(emailId && variant);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (expanded) {
      setVariablesOpen(false);
      return;
    }

    if (canEditVariables) {
      setVariablesOpen(true);
    }
  }, [canEditVariables, expanded]);

  const syncIframeHeight = useCallback(() => {
    const iframe = iframeRef.current;
    const documentElement = iframe?.contentDocument?.documentElement;
    const body = iframe?.contentDocument?.body;

    if (!documentElement || !body) return;

    setIframeHeight(
      Math.max(documentElement.scrollHeight, body.scrollHeight, 640),
    );
  }, []);

  // Measure on load and keep measuring as the content reflows (images/fonts
  // loading), so the outer scroll container always covers the full email.
  const handleIframeLoad = useCallback(() => {
    syncIframeHeight();
    const body = iframeRef.current?.contentDocument?.body;
    resizeObserverRef.current?.disconnect();
    if (body && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => syncIframeHeight());
      observer.observe(body);
      resizeObserverRef.current = observer;
    }
  }, [syncIframeHeight]);

  useEffect(() => () => resizeObserverRef.current?.disconnect(), []);

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
          : expanded ? "" : "",
            // ? "transition-[opacity,transform] duration-150"
            // : "transition-[width,opacity,transform] duration-300",
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
        <div className="shrink-0 rounded-t-3xl bg-madoo-bg shadow-(--shadow-border-bottom)">
          <div className="flex min-h-13 items-center gap-3 bg-madoo-bg px-4">
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
              <ShareProjectDropdown
                email={email}
                emailId={emailId}
                onUpgrade={onOpenPricing}
              />
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

          <div className="flex min-h-11 items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              {canEditVariables ? (
                <Button
                  aria-label="Toggle variables panel"
                  aria-pressed={variablesOpen}
                  className="h-8 gap-2 rounded-lg px-3 text-xs font-medium"
                  onClick={() => setVariablesOpen((open) => !open)}
                  size="sm"
                  variant={variablesOpen ? "primary" : "secondary"}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={SourceCodeIcon}
                    primaryColor="currentColor"
                    size={15}
                    strokeWidth={1.55}
                  />
                  <span>Variables</span>
                </Button>
              ) : null}

              <VersionsDropdown
                activeId={variant?.id}
                latestId={latestVariantId}
                onSelect={onSelectVersion}
                variants={variants}
              />
            </div>

            <div className="flex items-center gap-2">
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
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden shadow-madoo-border">
          {variablesOpen && canEditVariables && variant ? (
            <VariablesPanel
              emailId={emailId!}
              key={variant.id}
              onClose={() => setVariablesOpen(false)}
              variables={variant.variableSchema.variables}
              variantId={variant.id}
            />
          ) : null}

          <div className="madoo-preview-scrollbar mr-1 h-full min-w-0 flex-1 overflow-y-auto">
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
                onLoad={handleIframeLoad}
                ref={iframeRef}
                scrolling="no"
                sandbox="allow-same-origin"
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
