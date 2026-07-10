import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  SparklesIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import type { VariableSpec, VisualEditOp } from "@madoo/shared";
import { cn } from "@/lib/utils";
import type { VisualEditSelection } from "./useVisualEditSelection";

const MAX_TEXT_LENGTH = 4000;

function ToolbarButton({
  danger = false,
  disabled = false,
  icon,
  label,
  onClick,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: typeof PencilEdit02Icon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors",
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-madoo-ink hover:bg-madoo-bg",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <HugeiconsIcon
        aria-hidden="true"
        icon={icon}
        primaryColor="currentColor"
        size={15}
        strokeWidth={1.55}
      />
      <span>{label}</span>
    </button>
  );
}

/**
 * Floating actions for the element selected in the preview iframe. Positioned
 * absolutely inside the overlay host that wraps the iframe, so it scrolls with
 * the email content.
 */
export function VisualEditToolbar({
  busy,
  onApply,
  onAskAi,
  onClose,
  selection,
  variables,
}: {
  busy: boolean;
  onApply: (ops: VisualEditOp[]) => void;
  onAskAi: () => void;
  onClose: () => void;
  selection: VisualEditSelection;
  variables: VariableSpec[] | undefined;
}) {
  const varName = selection.textKind?.startsWith("var:")
    ? selection.textKind.slice(4)
    : null;
  const prefill = varName
    ? (variables?.find((item) => item.name === varName)?.default ??
      selection.currentText)
    : selection.currentText;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(prefill);

  const canEditText = Boolean(selection.textKind) && !selection.dynamic;
  const canDelete = !selection.dynamic;

  const submitText = () => {
    const text = draft.trim();
    if (!text || text === prefill.trim()) {
      setEditing(false);
      return;
    }
    onApply([
      { op: "setText", nodeId: selection.nodeId, text: text.slice(0, MAX_TEXT_LENGTH) },
    ]);
  };

  const top = selection.rect.top + selection.rect.height + 8;
  const left = Math.max(8, selection.rect.left);

  return (
    <div
      className="absolute z-20 max-w-[calc(100%-16px)] rounded-xl bg-white p-1 shadow-[0_10px_32px_rgb(var(--ink-shadow-rgb)/0.22)] ring-1 ring-black/8"
      style={{ top, left }}
    >
      {editing ? (
        <div className="flex w-72 max-w-full flex-col gap-1.5 p-1.5">
          <textarea
            autoFocus
            className="madoo-chat-scrollbar min-h-16 w-full resize-y rounded-lg bg-madoo-bg p-2 text-xs text-madoo-ink outline-none ring-1 ring-black/8 focus:ring-madoo-accent"
            disabled={busy}
            maxLength={MAX_TEXT_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                submitText();
              }
              if (event.key === "Escape") setEditing(false);
            }}
            value={draft}
          />
          <div className="flex items-center justify-end gap-1">
            <ToolbarButton
              icon={Cancel01Icon}
              label="Cancel"
              onClick={() => setEditing(false)}
            />
            <ToolbarButton
              disabled={busy || !draft.trim()}
              icon={Tick02Icon}
              label={busy ? "Saving…" : "Save"}
              onClick={submitText}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-0.5">
          {canEditText ? (
            <ToolbarButton
              disabled={busy}
              icon={PencilEdit02Icon}
              label="Edit text"
              onClick={() => {
                setDraft(prefill);
                setEditing(true);
              }}
            />
          ) : null}
          <ToolbarButton
            disabled={busy}
            icon={SparklesIcon}
            label="Ask AI"
            onClick={onAskAi}
          />
          <ToolbarButton
            danger
            disabled={busy || !canDelete}
            icon={Delete02Icon}
            label={
              selection.dynamic ? "Repeated element — ask AI instead" : "Delete"
            }
            onClick={() =>
              onApply([{ op: "delete", nodeId: selection.nodeId }])
            }
          />
          <span className="mx-0.5 h-5 w-px bg-black/8" />
          <button
            aria-label="Deselect element"
            className="flex size-8 items-center justify-center rounded-lg text-madoo-ink-muted transition-colors hover:bg-madoo-bg"
            onClick={onClose}
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              icon={Cancel01Icon}
              primaryColor="currentColor"
              size={14}
              strokeWidth={1.55}
            />
          </button>
        </div>
      )}
    </div>
  );
}
