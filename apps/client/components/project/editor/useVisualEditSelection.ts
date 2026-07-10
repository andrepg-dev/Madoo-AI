import { useCallback, useEffect, useState, type RefObject } from "react";
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
`;

function buildLabel(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
  if (!text) return `<${tag}> element`;
  const snippet = text.length > 60 ? `${text.slice(0, 60)}…` : text;
  return `<${tag}> "${snippet}"`.slice(0, 120);
}

/**
 * Click-to-select inside the preview iframe. The iframe is
 * `sandbox="allow-same-origin"` with a srcDoc, so the parent can attach
 * listeners on `contentDocument` directly — no injected scripts needed.
 * `docVersion` must bump on every iframe load so listeners re-attach to the
 * fresh document (and stale selections from the previous document are dropped).
 */
export function useVisualEditSelection({
  enabled,
  iframeRef,
  overlayRef,
  docVersion,
}: {
  enabled: boolean;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  docVersion: number;
}) {
  const [selection, setSelection] = useState<VisualEditSelection | null>(null);

  const clearSelection = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    doc
      ?.querySelectorAll(`[${SELECTED_ATTR}]`)
      .forEach((node) => node.removeAttribute(SELECTED_ATTR));
    setSelection(null);
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

    // Highlight only the innermost taggable element under the cursor — CSS
    // `:hover` would outline every tagged ancestor at once.
    const onMouseOver = (event: MouseEvent) => {
      clearHover();
      const el = (event.target as Element | null)?.closest(
        `[${VISUAL_EDIT_ID_ATTR}]`,
      );
      el?.classList.add(HOVER_CLASS);
    };

    const onClick = (event: MouseEvent) => {
      // Swallow every click in edit mode: selecting a <Button> must not follow
      // its link.
      event.preventDefault();
      event.stopPropagation();
      doc
        .querySelectorAll(`[${SELECTED_ATTR}]`)
        .forEach((node) => node.removeAttribute(SELECTED_ATTR));
      const el = (event.target as Element | null)?.closest(
        `[${VISUAL_EDIT_ID_ATTR}]`,
      );
      const nodeId = el?.getAttribute(VISUAL_EDIT_ID_ATTR);
      if (!el || !nodeId) {
        setSelection(null);
        return;
      }
      el.setAttribute(SELECTED_ATTR, "1");
      setSelection({
        nodeId,
        label: buildLabel(el),
        textKind: el.getAttribute(VISUAL_EDIT_TEXT_ATTR),
        dynamic: el.getAttribute(VISUAL_EDIT_DYNAMIC_ATTR) === "1",
        currentText: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        rect: computeRect(el),
      });
    };

    doc.addEventListener("mouseover", onMouseOver, true);
    doc.addEventListener("click", onClick, true);
    return () => {
      doc.removeEventListener("mouseover", onMouseOver, true);
      doc.removeEventListener("click", onClick, true);
      clearHover();
      doc
        .querySelectorAll(`[${SELECTED_ATTR}]`)
        .forEach((node) => node.removeAttribute(SELECTED_ATTR));
      style.remove();
    };
  }, [enabled, docVersion, iframeRef, overlayRef]);

  return { selection, clearSelection };
}
