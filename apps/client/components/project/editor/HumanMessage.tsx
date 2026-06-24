import { useEffect, useRef, useState } from "react";
import { Button } from "@madoo/design-system";
import { Edit02Icon } from "@hugeicons/core-free-icons";
import { ActionButton } from "./ActionButton";
import { CopyActionButton } from "./CopyActionButton";

export function HumanMessage({
  children,
  disabled,
  images,
  onEdit,
}: {
  children: string;
  disabled?: boolean;
  images?: string[];
  onEdit?: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(children);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const text = children.trim();

  // Close the image lightbox on Escape.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

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
              onClick={() => setLightbox(url)}
              aria-label="Open image"
              className="cursor-zoom-in overflow-hidden rounded-lg shadow-madoo-border transition hover:opacity-90"
            >
              <img
                src={url}
                alt="Attached"
                className="h-20 w-20 object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
        >
          <img
            src={lightbox}
            alt="Attached"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      ) : null}

      <span className="ml-2.5 max-w-xl whitespace-pre-wrap wrap-break-word rounded-lg bg-madoo-bg px-4 py-2.5 font-figtree leading-relaxed shadow-madoo-border">
        {text}
      </span>

      <div className="my-1.5 flex max-w-min gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <ActionButton
          icon={Edit02Icon}
          label="Edit message"
          onClick={disabled ? undefined : startEditing}
        />
        <CopyActionButton label="Copy message" text={text} />
      </div>
    </div>
  );
}

