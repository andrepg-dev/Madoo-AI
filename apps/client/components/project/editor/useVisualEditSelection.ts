import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  VISUAL_EDIT_DYNAMIC_ATTR,
  VISUAL_EDIT_ID_ATTR,
  VISUAL_EDIT_TEXT_ATTR,
} from "@madoo/shared";

export type VisualEditSelection = {
  /** `line:column` id linking the DOM node back to the variant's TSX. */
  nodeId: string;
  /** Human label for chips/prompts, e.g. `<p> "Fresh headline…"`. */
  label: string;
  /** `literal`, `var:<name>` or null when the element has no editable text. */
  textKind: string | null;
  /** True for elements rendered inside loops/conditionals — structure ops are unsafe. */
  dynamic: boolean;
  /** Rendered text content, used to prefill the inline text editor. */
  currentText: string;
  /** Bounding box relative to the overlay host (the wrapper around the iframe). */
  rect: { top: number; left: number; width: number; height: number };
};

const HOVER_CLASS = "m-ve-hover";
const SELECTED_ATTR = "data-m-selected";

const EDITOR_STYLES = `
  [${VISUAL_EDIT_ID_ATTR}] { cursor: pointer; }
  .${HOVER_CLASS} { outline: 2px dashed rgba(53, 107, 255, 0.55) !important; outline-offset: -2px; }
  [${SELECTED_ATTR}="1"] { outline: 2px solid #356bff !important; outline-offset: -2px; }
  [contenteditable] { outline: 2px solid #16a34a !important; outline-offset: -2px; cursor: text; }
`;

function buildLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!text) return `<${tag}> element`;
  const snippet = text.length > 60 ? `${text.slice(0, 60)}…` : text;
  return `<${tag}> "${snippet}"`.slice(0, 120);
}

/**
 * Click-to-select and inline text editing inside the preview iframe. The
 * iframe is `sandbox="allow-same-origin"` with a srcDoc, so the parent can
 * attach listeners on `contentDocument` directly — no injected scripts.
 * `docVersion` must bump on every iframe load so listeners re-attach to the
 * fresh document (and stale selections from the previous document are dropped).
 */
export function useVisualEditSelection({
  enabled,
  iframeRef,
  overlayRef,
  docVersion,
  onCommitText,
}: {
  enabled: boolean;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  docVersion: number;
  /** Called when an inline edit is committed (Enter / click away). */
  onCommitText: (nodeId: string, text: string) => void;
}) {
  const [selection, setSelection] = useState<VisualEditSelection | null>(null);
  // True while the selected element is contentEditable (toolbar hides).
  const [editingText, setEditingText] = useState(false);
  const onCommitTextRef = useRef(onCommitText);
  onCommitTextRef.current = onCommitText;
  // Ends the active inline edit (commit or cancel); null when not editing.
  const finishEditRef = useRef<((commit: boolean) => void) | null>(null);

  const clearSelection = useCallback(() => {
    finishEditRef.current?.(false);
    const doc = iframeRef.current?.contentDocument;
    doc
      ?.querySelectorAll(`[${SELECTED_ATTR}]`)
      .forEach((node) => node.removeAttribute(SELECTED_ATTR));
    setSelection(null);
  }, [iframeRef]);

  /**
   * Turns the selected element contentEditable so the user types the new copy
   * in place (WYSIWYG). Enter or clicking away commits as a setText op;
   * Escape restores the original content.
   */
  const startTextEdit = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    const el = doc?.querySelector(
      `[${SELECTED_ATTR}="1"]`,
    ) as HTMLElement | null;
    if (!doc || !el || finishEditRef.current) return;
    const nodeId = el.getAttribute(VISUAL_EDIT_ID_ATTR);
    if (!nodeId) return;

    const originalHtml = el.innerHTML;
    const originalText = (el.textContent ?? "").replace(/\s+/g, " ").trim();

    function finish(commit: boolean) {
      if (!finishEditRef.current) return;
      finishEditRef.current = null;
      setEditingText(false);
      el!.removeAttribute("contenteditable");
      el!.removeEventListener("keydown", onKeyDown);
      el!.removeEventListener("blur", onBlur);
      const text = (el!.textContent ?? "").replace(/\s+/g, " ").trim();
      if (!commit || !text || text === originalText) {
        el!.innerHTML = originalHtml;
        return;
      }
      onCommitTextRef.current(nodeId!, text);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        finish(true);
      } else if (event.key === "Escape") {
        event.preventDefault();
        finish(false);
      }
    }
    function onBlur() {
      finish(true);
    }

    finishEditRef.current = finish;
    setEditingText(true);
    // plaintext-only keeps pasted markup out; fall back where unsupported.
    el.setAttribute("contenteditable", "plaintext-only");
    if (el.contentEditable !== "plaintext-only") {
      el.setAttribute("contenteditable", "true");
    }
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("blur", onBlur);
    el.focus();
    const range = doc.createRange();
    range.selectNodeContents(el);
    const domSelection = doc.getSelection?.() ?? doc.defaultView?.getSelection();
    domSelection?.removeAllRanges();
    domSelection?.addRange(range);
  }, [iframeRef]);

  useEffect(() => {
    setSelection(null);
    if (!enabled) return;
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc?.body) return;

    const style = doc.createElement("style");
    style.textContent = EDITOR_STYLES;
    (doc.head ?? doc.documentElement).appendChild(style);

    const computeRect = (el: Element) => {
      const iframeRect = iframe.getBoundingClientRect();
      const hostRect =
        overlayRef.current?.getBoundingClientRect() ?? iframeRect;
      // The iframe never scrolls internally (it is sized to its content), so
      // client coords inside it map 1:1 onto the iframe element's box.
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top + iframeRect.top - hostRect.top,
        left: rect.left + iframeRect.left - hostRect.left,
        width: rect.width,
        height: rect.height,
      };
    };

    const clearHover = () => {
      doc
        .querySelectorAll(`.${HOVER_CLASS}`)
        .forEach((node) => node.classList.remove(HOVER_CLASS));
    };

    const selectElement = (el: Element) => {
      doc
        .querySelectorAll(`[${SELECTED_ATTR}]`)
        .forEach((node) => node.removeAttribute(SELECTED_ATTR));
      el.setAttribute(SELECTED_ATTR, "1");
      setSelection({
        nodeId: el.getAttribute(VISUAL_EDIT_ID_ATTR)!,
        label: buildLabel(el),
        textKind: el.getAttribute(VISUAL_EDIT_TEXT_ATTR),
        dynamic: el.getAttribute(VISUAL_EDIT_DYNAMIC_ATTR) === "1",
        currentText: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        rect: computeRect(el),
      });
    };

    // Highlight only the innermost taggable element under the cursor — CSS
    // `:hover` would outline every tagged ancestor at once.
    const onMouseOver = (event: MouseEvent) => {
      clearHover();
      const el = (event.target as Element | null)?.closest(
        `[${VISUAL_EDIT_ID_ATTR}]`,
      );
      if (el && !el.hasAttribute("contenteditable")) el.classList.add(HOVER_CLASS);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      // Clicks inside the element being edited place the caret — leave them be.
      if (target?.closest("[contenteditable]")) return;
      // Swallow every other click in edit mode: selecting a <Button> must not
      // follow its link. Clicking away also commits any active inline edit
      // (the blur listener fires first).
      event.preventDefault();
      event.stopPropagation();
      const el = target?.closest(`[${VISUAL_EDIT_ID_ATTR}]`);
      if (!el || !el.getAttribute(VISUAL_EDIT_ID_ATTR)) {
        doc
          .querySelectorAll(`[${SELECTED_ATTR}]`)
          .forEach((node) => node.removeAttribute(SELECTED_ATTR));
        setSelection(null);
        return;
      }
      selectElement(el);
    };

    // Double-click on an editable text starts typing in place directly.
    const onDblClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[contenteditable]")) return;
      event.preventDefault();
      const el = target?.closest(`[${VISUAL_EDIT_ID_ATTR}]`);
      if (
        !el ||
        !el.getAttribute(VISUAL_EDIT_TEXT_ATTR) ||
        el.getAttribute(VISUAL_EDIT_DYNAMIC_ATTR) === "1"
      ) {
        return;
      }
      selectElement(el);
      startTextEdit();
    };

    doc.addEventListener("mouseover", onMouseOver, true);
    doc.addEventListener("click", onClick, true);
    doc.addEventListener("dblclick", onDblClick, true);
    return () => {
      finishEditRef.current?.(false);
      doc.removeEventListener("mouseover", onMouseOver, true);
      doc.removeEventListener("click", onClick, true);
      doc.removeEventListener("dblclick", onDblClick, true);
      clearHover();
      doc
        .querySelectorAll(`[${SELECTED_ATTR}]`)
        .forEach((node) => node.removeAttribute(SELECTED_ATTR));
      style.remove();
    };
  }, [enabled, docVersion, iframeRef, overlayRef, startTextEdit]);

  return { selection, clearSelection, startTextEdit, editingText };
}
