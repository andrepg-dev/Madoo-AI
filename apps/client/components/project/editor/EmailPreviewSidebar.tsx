import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Button, SegmentedControl, useToast } from "@madoo/design-system";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownPlusIcon, CursorMagicSelection01Icon, EyeIcon, FileExportIcon, Loading03Icon, PanelLeftIcon, PanelRightIcon, SourceCodeIcon, SparklesIcon, TestTube02Icon } from "@hugeicons/core-free-icons";
import type { EmailDto, EmailVariantDto, SelectedEmailElement, VisualEditOp } from "@madoo/shared";
import { cn } from "@/lib/utils";
import { VariablesPanel } from "@/components/project/preview/VariablesPanel";
import { defaultPreviewWidthVw, previewModeItems, previewThemeItems } from "./constants";
import { clampPreviewWidth } from "./utils";
import { latestVariant } from "./chat-utils";
import type { PreviewMode, TemplateTheme } from "./types";
import { HeaderPillButton } from "./HeaderPillButton";
import { ShareProjectDropdown } from "./ShareProjectDropdown";
import { StylePanel } from "./StylePanel";
import { VersionsDropdown } from "./VersionsDropdown";
import { VisualEditToolbar } from "./VisualEditToolbar";
import { useVisualEditSelection } from "./useVisualEditSelection";

/** Wiring for the click-to-edit mode; the page owns the state, the sidebar renders it. */
export type VisualEditController = {
  /** Edit mode toggle state. */
  enabled: boolean;
  /** Tagged HTML for the active variant is still being fetched. */
  loading: boolean;
  /** A visual-edit apply request is in flight. */
  applying: boolean;
  /** Remounts the iframe after a failed optimistic save. */
  resetVersion: number;
  onToggle: () => void;
  onApply: (ops: VisualEditOp[]) => void;
  onAskAi: (element: SelectedEmailElement) => void;
  onReplaceImage: (nodeId: string, file: File) => Promise<string>;
};

export function EmailPreviewSidebar({
  expanded,
  email,
  emailId,
  fullWidth = false,
  mode,
  onOpenExport,
  onOpenPreview,
  onOpenPricing,
  onOpenTesting,
  onSelectVersion,
  onToggleExpanded,
  open,
  setMode,
  showUpgradeButton,
  srcDoc,
  setTheme,
  setWidth,
  subject,
  theme,
  variant,
  visualEdit,
  width,
}: {
  expanded: boolean;
  email: EmailDto | null | undefined;
  emailId: string | null;
  /** Mobile: fill the available width and drop the desktop vw resizing. */
  fullWidth?: boolean;
  mode: PreviewMode;
  onOpenExport: () => void;
  onOpenPreview: () => void;
  onOpenPricing: () => void;
  onOpenTesting: () => void;
  onSelectVersion: (id: string | null) => void;
  onToggleExpanded: () => void;
  open: boolean;
  setMode: (mode: PreviewMode) => void;
  showUpgradeButton: boolean;
  srcDoc: string;
  setTheme: (theme: TemplateTheme) => void;
  setWidth: (width: number) => void;
  subject: string;
  theme: TemplateTheme;
  variant: EmailVariantDto | null;
  /** Present when this email supports click-to-edit; null hides the mode entirely. */
  visualEdit?: VisualEditController | null;
  width: number;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(true);
  // Design panel opens automatically with the first selection so designers
  // land straight in manual property editing; the close button opts out.
  const [stylesOpen, setStylesOpen] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const [iframeHeight, setIframeHeight] = useState(900);
  const overlayRef = useRef<HTMLDivElement>(null);
  // Bumps on every iframe load so selection listeners re-attach to the new doc.
  const [docVersion, setDocVersion] = useState(0);

  const { toast } = useToast();
  const {
    selection,
    clearSelection,
    startTextEdit,
    editingText,
    dragging,
    removeElement,
    replaceImage,
    applyElementStyles,
    readElementStyles,
  } = useVisualEditSelection({
    enabled: Boolean(visualEdit?.enabled && !visualEdit.loading),
    iframeRef,
    overlayRef,
    scrollRef: previewScrollRef,
    docVersion,
    onCommitText: (nodeId, text) =>
      visualEdit?.onApply([{ op: "setText", nodeId, text }]),
    onMoveTo: (nodeId, targetId, position) =>
      visualEdit?.onApply([{ op: "moveTo", nodeId, targetId, position }]),
    onExitEditMode: () => {
      if (visualEdit?.enabled) visualEdit.onToggle();
    },
  });

  const applyVisualOps = useCallback(
    (ops: VisualEditOp[]) => {
      for (const op of ops) {
        if (op.op === "delete") removeElement(op.nodeId);
      }
      visualEdit?.onApply(ops);
    },
    [removeElement, visualEdit],
  );

  const uploadSelectedImage = useCallback(
    async (file: File | undefined) => {
      if (!file || !selection || !visualEdit) return;
      if (!file.type.startsWith("image/")) {
        toast({
          tone: "danger",
          title: "Not an image",
          body: "Pick an image file.",
        });
        return;
      }
      const nodeId = selection.nodeId;
      setImageUploading(true);
      try {
        const url = await visualEdit.onReplaceImage(nodeId, file);
        replaceImage(nodeId, url);
      } catch (error) {
        toast({
          tone: "danger",
          title: "Upload failed",
          body: error instanceof Error ? error.message : "Try again.",
        });
      } finally {
        setImageUploading(false);
      }
    },
    [replaceImage, selection, toast, visualEdit],
  );

  const variants = email?.variants ?? [];
  const latestVariantId = latestVariant(email)?.id;
  const canEditVariables = Boolean(emailId && variant);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // The Dark/Light toggle emulates the email client's color scheme: force the
  // email's own `prefers-color-scheme` blocks on or off instead of leaving
  // them to the viewer's OS setting. Both directions matter — light-base
  // emails carry a dark block, dark-by-design emails carry a light block.
  // Emails without scheme blocks simply look the same in both modes.
  const themedSrcDoc = useMemo(() => {
    const force = (on: boolean) => (on ? "@media all" : "@media not all");
    return srcDoc
      .replace(
        /@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)/gi,
        force(theme === "dark"),
      )
      .replace(
        /@media\s*\(\s*prefers-color-scheme\s*:\s*light\s*\)/gi,
        force(theme === "light"),
      );
  }, [srcDoc, theme]);

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
    setDocVersion((version) => version + 1);
    const body = iframeRef.current?.contentDocument?.body;
    resizeObserverRef.current?.disconnect();
    if (body && typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => syncIframeHeight());
      observer.observe(body);
      resizeObserverRef.current = observer;
    }
  }, [syncIframeHeight]);

  // Element boxes shift when the preview switches desktop/mobile or resizes —
  // a kept selection would float over the wrong spot.
  useEffect(() => {
    clearSelection();
  }, [clearSelection, mode, width]);

  // Double-clicking the preview is a natural "let me edit this" gesture —
  // enter edit mode without reaching for the toolbar button.
  useEffect(() => {
    if (!visualEdit || visualEdit.enabled) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const onDoubleClick = () => visualEdit.onToggle();
    doc.addEventListener("dblclick", onDoubleClick);
    return () => doc.removeEventListener("dblclick", onDoubleClick);
  }, [docVersion, visualEdit]);

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
        "min-h-0 overflow-hidden bg-white ease-out",
        fullWidth
          ? "relative h-full w-full min-w-0 shrink"
          : cn(
              "shrink-0",
              expanded ? "absolute inset-y-0 right-0 z-20" : "relative",
              isResizing ? "transition-[opacity,transform]" : "",
              open ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0",
            ),
      )}
      style={
        fullWidth
          ? undefined
          : {
              maxWidth: open
                ? expanded
                  ? "100vw"
                  : "calc(100vw - 320px)"
                : 0,
              minWidth: open ? (expanded ? "100vw" : "min(560px, 58vw)") : 0,
              width: open ? (expanded ? "100vw" : `${width}vw`) : 0,
            }
      }
    >
      {open && !fullWidth ? (
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

      <div
        className={cn(
          "flex h-full flex-col",
          fullWidth ? "min-w-0" : "min-w-105",
        )}
      >
        <div className="shrink-0 rounded-t-3xl bg-madoo-bg shadow-(--shadow-border-bottom)">
          <div className="flex min-h-13 items-center gap-3 bg-madoo-bg px-4">
            <Button
              aria-label={
                expanded ? "Collapse email preview" : "Expand email preview"
              }
              className={cn(
                "size-9 shrink-0 rounded-lg",
                fullWidth && "hidden",
              )}
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

            <div
              className={cn(
                "ml-auto flex items-center gap-1.5",
                fullWidth
                  ? "madoo-chat-scrollbar min-w-0 overflow-x-auto [&>*]:shrink-0"
                  : "shrink-0",
              )}
            >
              <ShareProjectDropdown
                email={email}
                emailId={emailId}
              />
              <HeaderPillButton
                className="bg-white text-[#101114] hover:bg-[#f3f4f6]"
                label="Preview email"
                leftIcon={EyeIcon}
                onClick={onOpenPreview}
              >
                Preview
              </HeaderPillButton>
              {showUpgradeButton ? (
                <HeaderPillButton
                  className="text-white shadow-none"
                  label="Upgrade exports"
                  leftIcon={CrownPlusIcon}
                  onClick={onOpenPricing}
                  style={{ backgroundColor: "#101114", color: "#ffffff" }}
                >
                  Upgrade
                </HeaderPillButton>
              ) : null}
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

          <div
            className={cn(
              "flex min-h-11 items-center gap-2 px-4",
              fullWidth
                ? "madoo-chat-scrollbar overflow-x-auto [&>*]:shrink-0"
                : "justify-between",
            )}
          >
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

              {visualEdit ? (
                <Button
                  aria-label="Toggle visual edit mode"
                  aria-pressed={visualEdit.enabled}
                  className="h-8 gap-2 rounded-lg px-3 text-xs font-medium"
                  onClick={visualEdit.onToggle}
                  size="sm"
                  variant={visualEdit.enabled ? "primary" : "secondary"}
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={CursorMagicSelection01Icon}
                    primaryColor="currentColor"
                    size={15}
                    strokeWidth={1.55}
                  />
                  <span>{visualEdit.loading ? "Edit…" : "Edit"}</span>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className={cn(
                      "transition-opacity",
                      visualEdit.applying
                        ? "animate-spin opacity-100"
                        : "opacity-0",
                    )}
                    icon={Loading03Icon}
                    primaryColor="currentColor"
                    size={12}
                    strokeWidth={2.1}
                  />
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

              <SegmentedControl
                aria-label="Email color scheme"
                className="rounded-lg bg-madoo-surface p-1 shadow-none"
                items={previewThemeItems}
                onChange={(value) => setTheme(value as TemplateTheme)}
                value={theme}
              />
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 overflow-hidden shadow-madoo-border">
          {variablesOpen && canEditVariables && variant ? (
            <VariablesPanel
              emailId={emailId!}
              key={variant.id}
              onClose={() => setVariablesOpen(false)}
              variables={variant.variableSchema.variables}
              variantId={variant.id}
            />
          ) : null}

          <div
            className="madoo-preview-scrollbar mr-1 h-full min-w-0 flex-1 overflow-y-auto"
            ref={previewScrollRef}
          >
            {/* Overlay host: the floating toolbar is positioned against this
                wrapper so it scrolls with the email content. */}
            <div className="relative" ref={overlayRef}>
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
                  key={visualEdit?.resetVersion ?? 0}
                  ref={iframeRef}
                  scrolling="no"
                  sandbox="allow-same-origin"
                  srcDoc={themedSrcDoc}
                  style={{ height: iframeHeight }}
                  title="Generated email template preview"
                />
              </div>

              {visualEdit?.enabled && selection && !editingText && !dragging ? (
                <VisualEditToolbar
                  imageUploading={imageUploading}
                  key={selection.nodeId}
                  onApply={applyVisualOps}
                  onAskAi={() => {
                    visualEdit.onAskAi({
                      nodeId: selection.nodeId,
                      label: selection.label,
                    });
                    clearSelection();
                  }}
                  onClose={clearSelection}
                  onEditText={startTextEdit}
                  onOpenStyles={() => setStylesOpen(true)}
                  onReplaceImage={() => imageInputRef.current?.click()}
                  selection={selection}
                  stylesOpen={stylesOpen}
                />
              ) : null}
              <input
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void uploadSelectedImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
                ref={imageInputRef}
                type="file"
              />
            </div>
          </div>

          {visualEdit?.enabled && selection && stylesOpen ? (
            <StylePanel
              className={
                fullWidth
                  ? "absolute inset-y-0 right-0 z-30 shadow-[-12px_0_32px_rgb(var(--ink-shadow-rgb)/0.14)]"
                  : undefined
              }
              isImage={selection.image}
              key={selection.nodeId}
              label={selection.label}
              nodeId={selection.nodeId}
              onClose={() => setStylesOpen(false)}
              onCommit={(nodeId, styles) =>
                visualEdit.onApply([{ op: "setStyle", nodeId, styles }])
              }
              onPreview={applyElementStyles}
              readStyles={readElementStyles}
            />
          ) : null}
        </div>
      </div>
    </aside>
  );
}
