import { useEffect, useRef, useState } from "react";
import { Button } from "@madoo/design-system";
import { Cancel01Icon, Edit02Icon, SparklesIcon, Target02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ActionButton } from "./ActionButton";
import { CopyActionButton } from "./CopyActionButton";

export function HumanMessage({
  children,
  disabled,
  images,
  onEdit,
  selectedElementLabel,
  skills,
}: {
  children: string;
  disabled?: boolean;
  images?: string[];
  onEdit?: (text: string) => void;
  /** Design skills attached to this turn from the composer picker. */
  skills?: { name: string; label: string }[];
  /** Preview element this message targeted via the visual editor's Ask AI. */
  selectedElementLabel?: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(children);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const text = children.trim();

  const autoGrow = (element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  };

  useEffect(() => {
    const element = textareaRef.current;
    if (!editing || !element) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
    autoGrow(element);
  }, [editing]);

  // Close the image lightbox on Escape.
  useEffect(() => {
    if (!previewUrl) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewUrl(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewUrl]);

  const startEditing = () => {
    setDraft(children);
    setEditing(true);
  };

  const submitEdit = () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === children.trim()) return;
    onEdit?.(trimmed);
  };

  if (editing) {
    return (
      <div className="ml-auto w-full max-w-xl">
        <textarea
          className="w-full resize-none rounded-lg bg-madoo-bg px-4 py-2 font-figtree text-sm text-madoo-ink shadow-madoo-border outline-none"
          onChange={(event) => {
            setDraft(event.target.value);
            autoGrow(event.target);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setEditing(false);
            } else if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitEdit();
            }
          }}
          ref={textareaRef}
          value={draft}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button onClick={() => setEditing(false)} size="sm" variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={!draft.trim()}
            onClick={submitEdit}
            size="sm"
            variant="primary"
          >
            Send
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group ml-auto flex w-full max-w-xl flex-col items-end">
      {images && images.length > 0 ? (
        <div className="mb-1.5 flex max-w-xl flex-wrap justify-end gap-2">
          {images.map((url) => (
            <button
              key={url}
              type="button"
              onClick={() => setPreviewUrl(url)}
              aria-label="Open attached image"
              className="h-20 w-20 cursor-pointer overflow-hidden rounded-lg shadow-madoo-border"
            >
              <img
                src={url}
                alt="Attached"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {selectedElementLabel ? (
        <span className="mb-1.5 flex min-w-0 max-w-xl items-center gap-1.5 rounded-full bg-madoo-bg py-1 pl-2.5 pr-3 text-xs text-madoo-ink-muted shadow-madoo-border">
          <HugeiconsIcon
            aria-hidden="true"
            icon={Target02Icon}
            primaryColor="currentColor"
            size={13}
            strokeWidth={1.6}
          />
          <span className="min-w-0 truncate">
            Editing {selectedElementLabel}
          </span>
        </span>
      ) : null}

      <span className="ml-2.5 max-w-xl whitespace-pre-wrap wrap-break-word rounded-lg bg-madoo-bg px-4 py-2.5 font-figtree leading-relaxed shadow-madoo-border">
        {text}
      </span>

      {skills && skills.length > 0 ? (
        <span className="ml-2.5 mt-1.5 flex max-w-xl flex-wrap justify-end gap-1.5">
          {skills.map((skill) => (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-madoo-bg py-1 pl-2.5 pr-3 text-xs text-madoo-ink-muted shadow-madoo-border"
              key={skill.name}
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={SparklesIcon}
                primaryColor="currentColor"
                size={12}
                strokeWidth={1.6}
              />
              <span className="min-w-0 truncate">{skill.label}</span>
            </span>
          ))}
        </span>
      ) : null}

      <div className="my-1.5 flex max-w-min gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <ActionButton
          icon={Edit02Icon}
          label="Edit message"
          onClick={disabled ? undefined : startEditing}
        />
        <CopyActionButton label="Copy message" text={text} />
      </div>

      {previewUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Attached image"
          onClick={() => setPreviewUrl(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
        >
          <img
            src={previewUrl}
            alt="Attached"
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full cursor-default rounded-xl object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setPreviewUrl(null)}
            aria-label="Close image preview"
            className="absolute right-4 top-4 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={18}
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}

