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
  /** True when the selected rendered node is an image. */
  image: boolean;
  /**
   * Current link destination when the selection is a link, else null.
   * <Button> and <Link> both render as <a>, so the href lives on the selected
   * node itself; a nested <a> (an image wrapped in a link) is checked too.
   */
  link: string | null;
  /** Rendered text content, used to prefill the inline text editor. */
  currentText: string;
  /** Bounding box relative to the overlay host (the wrapper around the iframe). */
  rect: { top: number; left: number; width: number; height: number };
};

type DropPosition = "before" | "after";
type DropAxis = "horizontal" | "vertical";

const HOVER_CLASS = "m-ve-hover";
const SELECTED_ATTR = "data-m-selected";

const EDITOR_STYLES = `
  [${VISUAL_EDIT_ID_ATTR}] { cursor: default; }
  [${VISUAL_EDIT_DYNAMIC_ATTR}="1"] { cursor: pointer; }
  .${HOVER_CLASS} { outline: 2px dashed rgba(53, 107, 255, 0.55) !important; outline-offset: -2px; }
  [${SELECTED_ATTR}="1"] { outline: 2px solid #356bff !important; outline-offset: -2px; }
  [contenteditable] { outline: 2px solid #16a34a !important; outline-offset: -2px; cursor: text; }
`;

/**
 * The href of a selected link. Only an href the TSX can actually own is
 * reported: a placeholder "#" still counts (the user should be able to fix it),
 * but an anchor with no href at all does not.
 */
function readLink(el: Element): string | null {
  const anchor =
    el.tagName.toLowerCase() === "a" ? el : el.querySelector(":scope > a");
  if (!anchor) return null;
  const href = anchor.getAttribute("href");
  return href === null ? null : href;
}

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
  scrollRef,
  docVersion,
  onCommitText,
  onMoveTo,
}: {
  enabled: boolean;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  overlayRef: RefObject<HTMLDivElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  docVersion: number;
  /** Called when an inline edit is committed (Enter / click away). */
  onCommitText: (nodeId: string, text: string) => void;
  onMoveTo: (nodeId: string, targetId: string, position: DropPosition) => void;
}) {
  const [selection, setSelection] = useState<VisualEditSelection | null>(null);
  // True while the selected element is contentEditable (toolbar hides).
  const [editingText, setEditingText] = useState(false);
  const [dragging, setDragging] = useState(false);
  const onCommitTextRef = useRef(onCommitText);
  onCommitTextRef.current = onCommitText;
  const onMoveToRef = useRef(onMoveTo);
  onMoveToRef.current = onMoveTo;
  // Ends the active inline edit (commit or cancel); null when not editing.
  const finishEditRef = useRef<((commit: boolean) => void) | null>(null);
  const dragRef = useRef<{
    active: boolean;
    bodyCursor: string;
    bodyUserSelect: string;
    cursor: string;
    el: HTMLElement;
    ghost: HTMLDivElement | null;
    nodeId: string;
    opacity: string;
    pointerId: number;
    startX: number;
    startY: number;
  } | null>(null);
  // Recomputes the selection's overlay rect after live style changes reflow
  // the email; set inside the effect where computeRect lives.
  const refreshRectRef = useRef<() => void>(() => undefined);
  // Survives iframe reloads: after an autosave recompiles the email the doc
  // remounts, and the same node id is re-selected so the style panel stays
  // open mid-editing. Cleared on explicit deselection.
  const lastNodeIdRef = useRef<string | null>(null);
  const dropIndicatorRef = useRef<HTMLDivElement | null>(null);
  const dropTargetRef = useRef<{
    element: HTMLElement;
    nodeId: string;
    position: DropPosition;
  } | null>(null);
  const justDraggedRef = useRef(false);

  const clearSelection = useCallback(() => {
    lastNodeIdRef.current = null;
    finishEditRef.current?.(false);
    const doc = iframeRef.current?.contentDocument;
    doc
      ?.querySelectorAll(`[${SELECTED_ATTR}]`)
      .forEach((node) => node.removeAttribute(SELECTED_ATTR));
    setSelection(null);
  }, [iframeRef]);

  const removeElement = useCallback(
    (nodeId: string) => {
      const element = iframeRef.current?.contentDocument?.querySelector(
        `[${VISUAL_EDIT_ID_ATTR}="${nodeId}"]`,
      );
      element?.remove();
      if (lastNodeIdRef.current === nodeId) lastNodeIdRef.current = null;
      setSelection((current) =>
        current?.nodeId === nodeId ? null : current,
      );
    },
    [iframeRef],
  );

  const replaceImage = useCallback(
    (nodeId: string, url: string) => {
      const element = iframeRef.current?.contentDocument?.querySelector(
        `[${VISUAL_EDIT_ID_ATTR}="${nodeId}"]`,
      );
      if (element?.tagName.toLowerCase() !== "img") return;
      (element as HTMLImageElement).src = url;
      element.removeAttribute(SELECTED_ATTR);
      setSelection((current) =>
        current?.nodeId === nodeId ? null : current,
      );
    },
    [iframeRef],
  );

  /**
   * Applies inline styles to every rendered copy of the node (dynamic
   * elements render N times from one TSX node) for an instant WYSIWYG
   * preview; the durable change is committed separately as a setStyle op.
   * `null` clears the inline property.
   */
  const applyElementStyles = useCallback(
    (nodeId: string, styles: Record<string, string | null>) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      doc
        .querySelectorAll(`[${VISUAL_EDIT_ID_ATTR}="${nodeId}"]`)
        .forEach((node) => {
          const style = (node as HTMLElement).style as unknown as Record<
            string,
            string
          >;
          for (const [prop, value] of Object.entries(styles)) {
            style[prop] = value ?? "";
          }
        });
      refreshRectRef.current();
    },
    [iframeRef],
  );

  /**
   * Snapshot of the node's current computed style, used to prefill the style
   * panel controls. Returns null when the node is gone (stale selection).
   */
  const readElementStyles = useCallback(
    (nodeId: string): CSSStyleDeclaration | null => {
      const doc = iframeRef.current?.contentDocument;
      const el = doc?.querySelector(
        `[${VISUAL_EDIT_ID_ATTR}="${nodeId}"]`,
      ) as HTMLElement | null;
      const view = doc?.defaultView;
      if (!el || !view) return null;
      return view.getComputedStyle(el);
    },
    [iframeRef],
  );

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

    refreshRectRef.current = () => {
      const el = doc.querySelector(`[${SELECTED_ATTR}="1"]`);
      if (!el) return;
      const rect = computeRect(el);
      setSelection((current) => (current ? { ...current, rect } : current));
    };

    const hideDropIndicator = () => {
      dropTargetRef.current = null;
      if (dropIndicatorRef.current) {
        dropIndicatorRef.current.style.display = "none";
      }
    };

    const cleanupDrag = (suppressClick: boolean) => {
      const drag = dragRef.current;
      if (suppressClick) {
        justDraggedRef.current = true;
        doc.defaultView?.setTimeout(() => {
          justDraggedRef.current = false;
        }, 80);
      }
      if (drag) {
        if (drag.el.hasPointerCapture(drag.pointerId)) {
          drag.el.releasePointerCapture(drag.pointerId);
        }
        drag.el.style.opacity = drag.opacity;
        drag.el.style.cursor = drag.cursor;
        drag.ghost?.remove();
        doc.body.style.cursor = drag.bodyCursor;
        doc.body.style.userSelect = drag.bodyUserSelect;
      }
      dropIndicatorRef.current?.remove();
      dropIndicatorRef.current = null;
      dropTargetRef.current = null;
      dragRef.current = null;
      setDragging(false);
    };

    const selectElement = (el: Element) => {
      doc
        .querySelectorAll(`[${SELECTED_ATTR}]`)
        .forEach((node) => node.removeAttribute(SELECTED_ATTR));
      el.setAttribute(SELECTED_ATTR, "1");
      lastNodeIdRef.current = el.getAttribute(VISUAL_EDIT_ID_ATTR);
      setSelection({
        nodeId: el.getAttribute(VISUAL_EDIT_ID_ATTR)!,
        label: buildLabel(el),
        textKind: el.getAttribute(VISUAL_EDIT_TEXT_ATTR),
        dynamic: el.getAttribute(VISUAL_EDIT_DYNAMIC_ATTR) === "1",
        image: el.tagName.toLowerCase() === "img",
        link: readLink(el),
        currentText: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
        rect: computeRect(el),
      });
    };

    // Highlight only the innermost taggable element under the cursor — CSS
    // `:hover` would outline every tagged ancestor at once.
    const onMouseOver = (event: MouseEvent) => {
      if (dragRef.current?.active) return;
      clearHover();
      const el = (event.target as Element | null)?.closest(
        `[${VISUAL_EDIT_ID_ATTR}]`,
      );
      if (el && !el.hasAttribute("contenteditable")) el.classList.add(HOVER_CLASS);
    };

    const onClick = (event: MouseEvent) => {
      if (justDraggedRef.current) {
        justDraggedRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
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
        lastNodeIdRef.current = null;
        setSelection(null);
        return;
      }
      selectElement(el);
    };

    // Double-click on an editable text starts typing in place directly.
    // Leaf content that isn't inline-editable (text mixed with variables,
    // images) still selects for the toolbar; structural wrappers and the
    // background around the email read as "outside" and clear the selection.
    const onDblClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[contenteditable]")) return;
      event.preventDefault();
      event.stopPropagation();
      const el = target?.closest(`[${VISUAL_EDIT_ID_ATTR}]`);
      if (
        el?.getAttribute(VISUAL_EDIT_TEXT_ATTR) &&
        el.getAttribute(VISUAL_EDIT_DYNAMIC_ATTR) !== "1"
      ) {
        selectElement(el);
        startTextEdit();
        return;
      }
      const isLeafContent =
        el &&
        !el.querySelector(`[${VISUAL_EDIT_ID_ATTR}]`) &&
        ((el.textContent ?? "").trim() !== "" ||
          el.tagName.toLowerCase() === "img");
      if (isLeafContent) {
        selectElement(el);
        return;
      }
      clearSelection();
    };

    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      const target = event.target as Element | null;
      if (target?.closest("[contenteditable]")) return;
      const el = target?.closest(
        `[${VISUAL_EDIT_ID_ATTR}]`,
      ) as HTMLElement | null;
      const nodeId = el?.getAttribute(VISUAL_EDIT_ID_ATTR);
      if (!el || !nodeId || el.getAttribute(VISUAL_EDIT_DYNAMIC_ATTR) === "1") {
        return;
      }
      cleanupDrag(false);
      dragRef.current = {
        active: false,
        bodyCursor: doc.body.style.cursor,
        bodyUserSelect: doc.body.style.userSelect,
        cursor: el.style.cursor,
        el,
        ghost: null,
        nodeId,
        opacity: el.style.opacity,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
    };

    const dropAxisFor = (candidate: HTMLElement): DropAxis => {
      const parent = candidate.parentElement;
      if (!parent) return "vertical";
      const computed = doc.defaultView?.getComputedStyle(parent);
      if (computed?.display === "table-row") return "horizontal";
      if (computed?.display === "flex") {
        return computed.flexDirection.startsWith("row")
          ? "horizontal"
          : "vertical";
      }

      const candidateRect = candidate.getBoundingClientRect();
      for (const sibling of Array.from(parent.children)) {
        if (sibling === candidate) continue;
        const siblingRect = (sibling as HTMLElement).getBoundingClientRect();
        const sameRow =
          Math.abs(
            candidateRect.top + candidateRect.height / 2 -
              (siblingRect.top + siblingRect.height / 2),
          ) < Math.max(candidateRect.height, siblingRect.height) / 2;
        if (sameRow && Math.abs(candidateRect.left - siblingRect.left) > 4) {
          return "horizontal";
        }
      }
      return "vertical";
    };

    const ensureDropIndicator = () => {
      if (dropIndicatorRef.current) return dropIndicatorRef.current;
      const indicator = doc.createElement("div");
      Object.assign(indicator.style, {
        background: "#356bff",
        borderRadius: "2px",
        display: "none",
        height: "3px",
        pointerEvents: "none",
        position: "absolute",
        zIndex: "2147483647",
      });
      doc.body.appendChild(indicator);
      dropIndicatorRef.current = indicator;
      return indicator;
    };

    const createDragGhost = (
      drag: NonNullable<typeof dragRef.current>,
      event: globalThis.PointerEvent,
    ) => {
      const rect = drag.el.getBoundingClientRect();
      const ghost = doc.createElement("div");
      const clone = drag.el.cloneNode(true) as HTMLElement;
      clone.removeAttribute(SELECTED_ATTR);
      clone.querySelectorAll(`[${SELECTED_ATTR}]`).forEach((node) =>
        node.removeAttribute(SELECTED_ATTR),
      );
      Object.assign(ghost.style, {
        background: "white",
        border: "1px solid rgba(53, 107, 255, 0.45)",
        borderRadius: "6px",
        boxShadow: "0 12px 30px rgba(15, 23, 42, 0.2)",
        left: "0",
        maxHeight: "140px",
        opacity: "0.92",
        overflow: "hidden",
        pointerEvents: "none",
        position: "fixed",
        top: "0",
        width: `${Math.min(Math.max(rect.width, 80), 280)}px`,
        zIndex: "2147483646",
      });
      ghost.appendChild(clone);
      doc.body.appendChild(ghost);
      drag.ghost = ghost;
      positionDragGhost(drag, event);
    };

    const positionDragGhost = (
      drag: NonNullable<typeof dragRef.current>,
      event: globalThis.PointerEvent,
    ) => {
      if (!drag.ghost) return;
      const width = drag.ghost.getBoundingClientRect().width;
      const left = Math.min(
        event.clientX + 14,
        doc.documentElement.clientWidth - width - 8,
      );
      drag.ghost.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(
        8,
        event.clientY + 14,
      )}px)`;
    };

    const autoScroll = (event: globalThis.PointerEvent) => {
      const scrollHost = scrollRef.current;
      if (!scrollHost) return;
      const hostRect = scrollHost.getBoundingClientRect();
      const pointerY = iframe.getBoundingClientRect().top + event.clientY;
      const edge = 64;
      if (pointerY < hostRect.top + edge) {
        scrollHost.scrollBy({ top: -18 });
      } else if (pointerY > hostRect.bottom - edge) {
        scrollHost.scrollBy({ top: 18 });
      }
    };

    const showDropTarget = (
      candidate: HTMLElement,
      position: DropPosition,
      axis: DropAxis,
    ) => {
      const candidateId = candidate.getAttribute(VISUAL_EDIT_ID_ATTR);
      if (!candidateId) {
        hideDropIndicator();
        return;
      }
      const rect = candidate.getBoundingClientRect();
      const indicator = ensureDropIndicator();
      dropTargetRef.current = {
        element: candidate,
        nodeId: candidateId,
        position,
      };
      indicator.style.display = "block";
      if (axis === "horizontal") {
        indicator.style.height = `${rect.height}px`;
        indicator.style.left = `${
          position === "before" ? rect.left : rect.right
        }px`;
        indicator.style.top = `${rect.top}px`;
        indicator.style.width = "3px";
      } else {
        indicator.style.height = "3px";
        indicator.style.left = `${rect.left}px`;
        indicator.style.top = `${
          position === "before" ? rect.top : rect.bottom
        }px`;
        indicator.style.width = `${rect.width}px`;
      }
    };

    const onPointerMove = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (!drag.active) {
        const distance = Math.hypot(
          event.clientX - drag.startX,
          event.clientY - drag.startY,
        );
        if (distance <= 6) return;
        drag.active = true;
        drag.el.setPointerCapture(event.pointerId);
        drag.el.style.opacity = "0.25";
        drag.el.style.cursor = "grabbing";
        doc.body.style.cursor = "grabbing";
        // Dragging across text would otherwise paint native selections.
        doc.body.style.userSelect = "none";
        ensureDropIndicator();
        createDragGhost(drag, event);
        clearHover();
        setDragging(true);
      }

      event.preventDefault();
      event.stopPropagation();
      positionDragGhost(drag, event);
      autoScroll(event);
      let candidate = doc
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest(`[${VISUAL_EDIT_ID_ATTR}]`) as HTMLElement | null;
      while (
        candidate &&
        (drag.el.contains(candidate) ||
          candidate.getAttribute(VISUAL_EDIT_DYNAMIC_ATTR) === "1")
      ) {
        candidate = candidate.parentElement?.closest(
          `[${VISUAL_EDIT_ID_ATTR}]`,
        ) as HTMLElement | null;
      }
      if (!candidate) {
        hideDropIndicator();
        return;
      }
      const rect = candidate.getBoundingClientRect();
      const axis = dropAxisFor(candidate);
      const position =
        axis === "horizontal"
          ? event.clientX < rect.left + rect.width / 2
            ? "before"
            : "after"
          : event.clientY < rect.top + rect.height / 2
            ? "before"
            : "after";
      showDropTarget(candidate, position, axis);
    };

    const onPointerUp = (event: globalThis.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      const wasActive = drag.active;
      const draggedId = drag.nodeId;
      const target = dropTargetRef.current;
      if (wasActive) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (wasActive && target) {
        const parent = target.element.parentNode;
        if (parent) {
          parent.insertBefore(
            drag.el,
            target.position === "before"
              ? target.element
              : target.element.nextSibling,
          );
        }
      }
      cleanupDrag(wasActive);
      if (wasActive && target) {
        doc.defaultView?.requestAnimationFrame(() => selectElement(drag.el));
        onMoveToRef.current(draggedId, target.nodeId, target.position);
      }
    };

    const onPointerCancel = (event: globalThis.PointerEvent) => {
      if (event.pointerId === dragRef.current?.pointerId) cleanupDrag(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      if (dragRef.current?.active) {
        cleanupDrag(false);
        return;
      }
      // Escape cancels an inline edit AND unfocuses the element.
      clearSelection();
    };

    // Re-select the node the user was working on before the iframe reloaded
    // (autosaves recompile the email). Style-only saves keep node positions,
    // so the id usually still exists; when it doesn't, selection stays empty.
    if (lastNodeIdRef.current) {
      const el = doc.querySelector(
        `[${VISUAL_EDIT_ID_ATTR}="${lastNodeIdRef.current}"]`,
      );
      if (el) selectElement(el);
    }

    doc.addEventListener("mouseover", onMouseOver, true);
    doc.addEventListener("click", onClick, true);
    doc.addEventListener("dblclick", onDblClick, true);
    doc.addEventListener("pointerdown", onPointerDown, true);
    doc.addEventListener("pointermove", onPointerMove, true);
    doc.addEventListener("pointerup", onPointerUp, true);
    doc.addEventListener("pointercancel", onPointerCancel, true);
    doc.addEventListener("keydown", onKeyDown, true);
    return () => {
      refreshRectRef.current = () => undefined;
      finishEditRef.current?.(false);
      cleanupDrag(false);
      doc.removeEventListener("mouseover", onMouseOver, true);
      doc.removeEventListener("click", onClick, true);
      doc.removeEventListener("dblclick", onDblClick, true);
      doc.removeEventListener("pointerdown", onPointerDown, true);
      doc.removeEventListener("pointermove", onPointerMove, true);
      doc.removeEventListener("pointerup", onPointerUp, true);
      doc.removeEventListener("pointercancel", onPointerCancel, true);
      doc.removeEventListener("keydown", onKeyDown, true);
      clearHover();
      doc
        .querySelectorAll(`[${SELECTED_ATTR}]`)
        .forEach((node) => node.removeAttribute(SELECTED_ATTR));
      style.remove();
    };
  }, [
    enabled,
    docVersion,
    iframeRef,
    overlayRef,
    scrollRef,
    startTextEdit,
    clearSelection,
  ]);

  return {
    selection,
    clearSelection,
    startTextEdit,
    editingText,
    dragging,
    removeElement,
    replaceImage,
    applyElementStyles,
    readElementStyles,
  };
}
