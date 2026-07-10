import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown02Icon,
  ArrowUp02Icon,
  Cancel01Icon,
  Delete02Icon,
  PencilEdit02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import type { VisualEditOp } from "@madoo/shared";
import { cn } from "@/lib/utils";
import type { VisualEditSelection } from "./useVisualEditSelection";

function ToolbarButton({
  danger = false,
  disabled = false,
  icon,
  label,
  onClick,
  showLabel = true,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: typeof PencilEdit02Icon;
  label: string;
  onClick: () => void;
  showLabel?: boolean;
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
      {showLabel ? <span>{label}</span> : null}
    </button>
  );
}

/**
 * Floating actions for the element selected in the preview iframe. Positioned
 * absolutely inside the overlay host that wraps the iframe, so it scrolls with
 * the email content. Text editing happens in place (contentEditable in the
 * iframe), so this bar only triggers it.
 */
export function VisualEditToolbar({
  busy,
  onApply,
  onAskAi,
  onClose,
  onEditText,
  selection,
}: {
  busy: boolean;
  onApply: (ops: VisualEditOp[]) => void;
  onAskAi: () => void;
  onClose: () => void;
  onEditText: () => void;
  selection: VisualEditSelection;
}) {
  const canEditText = Boolean(selection.textKind) && !selection.dynamic;
  const structural = !selection.dynamic;

  const top = selection.rect.top + selection.rect.height + 8;
  const left = Math.max(8, selection.rect.left);

  return (
    <div
      className="absolute z-20 max-w-[calc(100%-16px)] rounded-xl bg-white p-1 shadow-[0_10px_32px_rgb(var(--ink-shadow-rgb)/0.22)] ring-1 ring-black/8"
      style={{ top, left }}
    >
      <div className="flex items-center gap-0.5">
        {canEditText ? (
          <ToolbarButton
            disabled={busy}
            icon={PencilEdit02Icon}
            label="Edit text"
            onClick={onEditText}
          />
        ) : null}
        <ToolbarButton
          disabled={busy || !structural}
          icon={ArrowUp02Icon}
          label="Move up"
          onClick={() =>
            onApply([{ op: "move", nodeId: selection.nodeId, direction: "up" }])
          }
          showLabel={false}
        />
        <ToolbarButton
          disabled={busy || !structural}
          icon={ArrowDown02Icon}
          label="Move down"
          onClick={() =>
            onApply([
              { op: "move", nodeId: selection.nodeId, direction: "down" },
            ])
          }
          showLabel={false}
        />
        <ToolbarButton
          disabled={busy}
          icon={SparklesIcon}
          label="Ask AI"
          onClick={onAskAi}
        />
        <ToolbarButton
          danger
          disabled={busy || !structural}
          icon={Delete02Icon}
          label={
            selection.dynamic ? "Repeated element — ask AI instead" : "Delete"
          }
          onClick={() => onApply([{ op: "delete", nodeId: selection.nodeId }])}
          showLabel={!selection.dynamic}
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
    </div>
  );
}
