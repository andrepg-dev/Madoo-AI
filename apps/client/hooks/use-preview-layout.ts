"use client";

import { defaultPreviewWidthVw } from "@/components/project/editor/constants";
import type {
  PreviewMode,
  TemplateTheme,
} from "@/components/project/editor/types";
import { useCallback, useState } from "react";

/**
 * Local UI state for the email preview pane: device mode, theme, the resizable
 * width, the expanded (full-bleed) toggle, and the standalone overlay. Lives in
 * the page (not the global store) because it resets per project visit.
 */
export function usePreviewLayout() {
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const [theme, setTheme] = useState<TemplateTheme>("light");
  const [width, setWidth] = useState(defaultPreviewWidthVw);
  const [widthBeforeExpand, setWidthBeforeExpand] = useState(defaultPreviewWidthVw);
  const [expanded, setExpanded] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // A manual resize always exits the expanded (full-bleed) state.
  const changeWidth = useCallback((next: number) => {
    setExpanded(false);
    setWidth(next);
  }, []);

  // Expanding remembers the current width so collapsing can restore it.
  const toggleExpanded = useCallback(() => {
    if (expanded) {
      setWidth(widthBeforeExpand);
      setExpanded(false);
      return;
    }
    setWidthBeforeExpand(width);
    setExpanded(true);
  }, [expanded, width, widthBeforeExpand]);

  const collapse = useCallback(() => setExpanded(false), []);

  return {
    mode,
    setMode,
    theme,
    setTheme,
    width,
    setWidth: changeWidth,
    expanded,
    toggleExpanded,
    collapse,
    overlayOpen,
    setOverlayOpen,
  };
}
