import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkBadge01Icon,
  Globe02Icon,
  Image01Icon,
  Loading03Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { ToolCallView } from "./types";

function iconFor(name: string): IconSvgElement {
  if (name === "find_images") return Image01Icon;
  if (name === "inspect_website_brand") return Globe02Icon;
  return Search01Icon;
}

function ToolCallCard({ call }: { call: ToolCallView }) {
  const running = call.status === "running";
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
        <span className="text-xs font-medium text-madoo-ink">{call.title}</span>
        {call.detail ? (
          <span className="truncate text-xs text-madoo-ink-muted">
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
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              alt=""
              className="size-12 rounded-md border border-madoo-border object-cover"
              loading="lazy"
              src={url}
            />
          ))}
        </div>
      ) : null}
    </div>
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
