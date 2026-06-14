"use client";

import { DeviceFramePreview } from "./DeviceFramePreview";
import {
  Cancel01Icon,
  LinkSquare02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect } from "react";

/**
 * Full-screen, distraction-free email preview. Shows the rendered email at real
 * device size inside a desktop browser frame or a phone bezel.
 */
export function PreviewOverlay({
  open,
  onClose,
  srcDoc,
  subject,
  onOpenInNewTab,
}: {
  open: boolean;
  onClose: () => void;
  srcDoc: string;
  subject: string;
  onOpenInNewTab?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-label="Email preview"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex flex-col bg-[#0b0c0f]/92 backdrop-blur-sm"
      role="dialog"
    >
      <header className="flex h-14 shrink-0 items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 text-white">
          <span className="truncate text-sm font-medium">{subject}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {onOpenInNewTab ? (
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={onOpenInNewTab}
              type="button"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={LinkSquare02Icon}
                primaryColor="currentColor"
                size={16}
                strokeWidth={1.6}
              />
              Open in new tab
            </button>
          ) : null}
          <button
            aria-label="Close preview"
            className="grid size-9 place-items-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={Cancel01Icon}
              primaryColor="currentColor"
              size={18}
              strokeWidth={1.7}
            />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 px-4 pb-6 sm:px-6">
        <DeviceFramePreview srcDoc={srcDoc} subject={subject} />
      </div>
    </div>
  );
}
