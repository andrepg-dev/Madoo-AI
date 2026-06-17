import type { ChatMessage } from "./types";

/**
 * Minimal live loader while a turn is generating: a small spinner, nothing
 * else. Leaves no "Worked for Ns" record behind — once the turn finishes it
 * renders nothing, so the response stands on its own.
 */
export function TimelineMessage({ message }: { message: ChatMessage }) {
  const finished = Boolean(message.finishedAt);

  if (finished) return null;

  return (
    <div className="mr-auto">
      <span className="block size-4 animate-spin rounded-full border-2 border-madoo-border border-t-madoo-ink" />
    </div>
  );
}
