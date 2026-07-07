"use client";

import { defaultPreviewWidthVw } from "@/components/project/editor/constants";
import type {
  PreviewMode,
  TemplateTheme,
} from "@/components/project/editor/types";
import { useCallback, useEffect, useState } from "react";

const THEME_STORAGE_KEY = "madoo:preview-theme";

/**
 * Local UI state for the email preview pane: device mode, theme, the resizable
 * width, the expanded (full-bleed) toggle, and the standalone overlay. Lives in
 * the page (not the global store) because it resets per project visit — except
 * the light/dark theme, which persists in localStorage across visits.
 */
export function usePreviewLayout() {
  const [mode, setMode] = useState<PreviewMode>("desktop");
  const [theme, setThemeState] = useState<TemplateTheme>("light");

  // Restore after mount (not in the initializer) so SSR markup matches the
  // first client render.
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") setThemeState(stored);
  }, []);

  const setTheme = useCallback((next: TemplateTheme) => {
    setThemeState(next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  }, []);
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
