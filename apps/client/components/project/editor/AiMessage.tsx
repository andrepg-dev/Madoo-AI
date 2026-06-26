import { Button } from "@madoo/design-system";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, RefreshIcon, ThumbsDownIcon, ThumbsUpIcon } from "@hugeicons/core-free-icons";
import { Streamdown } from "streamdown";
import { ActionButton } from "./ActionButton";
import { CopyActionButton } from "./CopyActionButton";
import { ThinkingBlock } from "./ThinkingBlock";
import { ToolCallCard, ToolCalls } from "./ToolCalls";
import type { AiMessageFeedback, MessagePart, ToolCallView } from "./types";

export function AiMessage({
  children,
  feedback,
  thinking,
  thinkingSeconds,
  thinkingActive,
  toolCalls,
  parts,
  generating,
  buildingEmail,
  versions,
  versionIndex = 0,
  onFeedback,
  onSelectVersion,
  onRegenerate,
  regenerating,
}: {
  children: string;
  feedback?: AiMessageFeedback | null;
  thinking?: string;
  thinkingSeconds?: number;
  thinkingActive?: boolean;
  toolCalls?: ToolCallView[];
  parts?: MessagePart[];
  generating?: boolean;
  buildingEmail?: boolean;
  versions?: {
    id: string;
    content: string;
    feedback?: AiMessageFeedback | null;
  }[];
  versionIndex?: number;
  onFeedback?: (feedback: AiMessageFeedback) => void;
  onSelectVersion?: (index: number) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  const total = versions?.length ?? 0;
  const hasVersions = total > 1;
  const thinkingText = thinking ?? "";
  const showThinking = thinkingText.length > 0 && Boolean(thinkingActive);
  const showActions = !showThinking && !generating;

  return (
    <div className="group mb-3.5 mr-auto rounded text-left">
      {showThinking ? (
        <ThinkingBlock
          active={thinkingActive}
          seconds={thinkingSeconds}
          text={thinkingText}
        />
      ) : null}
      {parts && parts.length > 0 ? (
        <div className="flex flex-col gap-2">
          {parts.map((part) =>
            part.kind === "text" ? (
              part.text.trim() ? (
                <Streamdown
                  className="ai-conversation-markdown font-figtree leading-6"
                  key={part.id}
                >
                  {part.text}
                </Streamdown>
              ) : null
            ) : (
              <ToolCallCard call={part.call} key={part.call.id} />
            ),
          )}
        </div>
      ) : (
        <>
          <Streamdown className="ai-conversation-markdown font-figtree leading-6">
            {children}
          </Streamdown>
          <ToolCalls calls={toolCalls} />
        </>
      )}

      {generating && buildingEmail ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-madoo-ink-muted">
          <span className="block size-3.5 animate-spin rounded-full border-2 border-madoo-border border-t-madoo-ink" />
          Building your email…
        </div>
      ) : null}

      {showActions ? (
        <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
          {hasVersions ? (
            <div className="mr-0.5 flex items-center text-xs text-madoo-ink-muted">
              <Button
                aria-label="Previous version"
                className="h-6 w-6 rounded-md"
                disabled={versionIndex <= 0}
                onClick={() => onSelectVersion?.(versionIndex - 1)}
                size="sm"
                variant="icon"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ArrowLeft01Icon}
                  primaryColor="currentColor"
                  size={13}
                  strokeWidth={1.7}
                />
              </Button>
              <span className="min-w-8 text-center tabular-nums">
                {versionIndex + 1}/{total}
              </span>
              <Button
                aria-label="Next version"
                className="h-6 w-6 rounded-md"
                disabled={versionIndex >= total - 1}
                onClick={() => onSelectVersion?.(versionIndex + 1)}
                size="sm"
                variant="icon"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  className="rotate-180"
                  icon={ArrowLeft01Icon}
                  primaryColor="currentColor"
                  size={13}
                  strokeWidth={1.7}
                />
              </Button>
            </div>
          ) : null}
          <CopyActionButton label="Copy response" text={children} />
          {feedback ? null : (
            <>
              <ActionButton
                icon={ThumbsUpIcon}
                label="Like response"
                onClick={() => onFeedback?.("LIKE")}
              />
              <ActionButton
                icon={ThumbsDownIcon}
                label="Dislike response"
                onClick={() => onFeedback?.("DISLIKE")}
              />
            </>
          )}
          {onRegenerate ? (
            <ActionButton
              icon={RefreshIcon}
              label="Regenerate response"
              onClick={regenerating ? undefined : onRegenerate}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
