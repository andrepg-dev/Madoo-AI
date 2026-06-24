import { useEffect, useState } from "react";
import type { ChatMessage } from "./types";

// Playful lines shown before/while the real backend step labels stream in, so
// the wait never feels dead. Cycled every few seconds.
const FALLBACK_LINES = [
  "Reading your brief…",
  "Sketching the layout…",
  "Picking colors & type…",
  "Writing the copy…",
  "Placing buttons & links…",
  "Polishing for mobile…",
  "Almost there…",
] as const;

/**
 * Live loader while a turn is generating: a small spinner plus a shimmering
 * caption. Shows the real backend step label when one has arrived, otherwise
 * cycles through playful build-status lines. Renders nothing once finished, so
 * the response stands on its own.
 */
export function TimelineMessage({ message }: { message: ChatMessage }) {
  const finished = Boolean(message.finishedAt);
  const steps = message.steps ?? [];
  const activeStep = steps[steps.length - 1]?.label;

  const [fallbackIndex, setFallbackIndex] = useState(0);
  useEffect(() => {
    if (finished || activeStep) return;
    const id = window.setInterval(
      () => setFallbackIndex((index) => (index + 1) % FALLBACK_LINES.length),
      2400,
    );
    return () => window.clearInterval(id);
  }, [finished, activeStep]);

  if (finished) return null;

  const caption = activeStep ?? FALLBACK_LINES[fallbackIndex];

  return (
    <div className="mr-auto flex items-center gap-2.5">
      <span className="block size-4 shrink-0 animate-spin rounded-full border-2 border-madoo-border border-t-madoo-ink" />
      <span
        key={caption}
        className="madoo-shimmer-text font-figtree text-sm font-medium"
      >
        {caption}
      </span>
    </div>
  );
}
