import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Chart01Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  Globe02Icon,
  Image01Icon,
  Loading03Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { ToolCallView } from "./types";

function iconFor(name: string): IconSvgElement {
  if (name === "find_images" || name === "get_email_icons") {
    return Image01Icon;
  }
  if (name === "inspect_website_brand") return Globe02Icon;
  if (name === "get_email_version") return Clock01Icon;
  if (name === "generate_chart") return Chart01Icon;
  return Search01Icon;
}

export function ToolCallCard({ call }: { call: ToolCallView }) {
  const running = call.status === "running";
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="rounded-lg border border-madoo-border bg-madoo-ink/[0.02] px-3 py-2">
      <div className="flex items-center gap-2">
        <HugeiconsIcon
          aria-hidden="true"
          className="shrink-0 text-madoo-ink-muted"
          icon={iconFor(call.name)}
          primaryColor="currentColor"
          size={15}
          strokeWidth={1.8}
        />
        <span className="shrink-0 whitespace-nowrap text-xs font-medium text-madoo-ink">
          {call.title}
        </span>
        {call.detail ? (
          <span className="min-w-0 flex-1 truncate text-xs text-madoo-ink-muted">
            {call.detail}
          </span>
        ) : null}
        <span className="ml-auto shrink-0">
          {running ? (
            <HugeiconsIcon
              aria-label="Running"
              className="animate-spin text-madoo-ink-muted"
              icon={Loading03Icon}
              primaryColor="currentColor"
              size={14}
              strokeWidth={2}
            />
          ) : (
            <HugeiconsIcon
              aria-label="Done"
              className="text-emerald-600"
              icon={CheckmarkBadge01Icon}
              primaryColor="currentColor"
              size={15}
              strokeWidth={1.8}
            />
          )}
        </span>
      </div>

      {call.summary && !running ? (
        <p className="mt-1 pl-[23px] text-xs text-madoo-ink-muted">
          {call.summary}
        </p>
      ) : null}

      {call.images && call.images.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5 pl-[23px]">
          {call.images.slice(0, 4).map((url) => (
            <button
              className="rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-madoo-ink/40"
              key={url}
              onClick={() => setPreview(url)}
              type="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Search result"
                className="size-12 rounded-md border border-madoo-border object-cover"
                loading="lazy"
                src={url}
              />
            </button>
          ))}
        </div>
      ) : null}

      <ImageLightbox onClose={() => setPreview(null)} src={preview} />
    </div>
  );
}

/** Fullscreen overlay showing a single image at full size; click/Esc to close. */
function ImageLightbox({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [src, onClose]);

  if (!src || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <button
        aria-label="Close"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        onClick={onClose}
        type="button"
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          primaryColor="currentColor"
          size={20}
          strokeWidth={2}
        />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Search result"
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        src={src}
      />
    </div>,
    document.body,
  );
}

/** Renders the tool calls made during a turn as a compact, streaming list. */
export function ToolCalls({ calls }: { calls?: ToolCallView[] }) {
  if (!calls || calls.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {calls.map((call) => (
        <ToolCallCard call={call} key={call.id} />
      ))}
    </div>
  );
}
