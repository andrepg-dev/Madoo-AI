"use client";

import {
  Add01Icon,
  ArrowRight01Icon,
  Attachment01Icon,
  Cancel01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  cx,
} from "@madoo/design-system";
import { useState } from "react";

export type PromptAttachment = {
  id: string;
  file: File;
  /** Object URL for image previews; null for non-image files. */
  url: string | null;
};

function AttachMenu({
  label,
  onUploadFile,
  onUploadImage,
}: {
  label: string;
  onUploadFile: () => void;
  onUploadImage: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        data-state={open ? "open" : "closed"}
        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#101114] transition-[background,color] duration-(--duration-fast) ease-out hover:bg-[rgb(var(--rule-rgb)/0.06)] data-[state=open]:bg-[rgb(var(--rule-rgb)/0.06)]"
      >
        <HugeiconsIcon
          icon={Add01Icon}
          size={18}
          strokeWidth={1.4}
          aria-hidden="true"
        />
      </button>

      <DropdownContent
        side="bottom"
        align="start"
        className="min-w-48 rounded-lg p-1.5 shadow-madoo-border!"
      >
        <AttachMenuItem
          icon={Image01Icon}
          label="Upload image"
          onSelect={onUploadImage}
        />
        <AttachMenuItem
          icon={Attachment01Icon}
          label="Upload file"
          onSelect={onUploadFile}
        />
      </DropdownContent>
    </Dropdown>
  );
}

function AttachMenuItem({
  icon,
  label,
  onSelect,
}: {
  icon: typeof Image01Icon;
  label: string;
  onSelect: () => void;
}) {
  return (
    <DropdownItem
      onSelect={onSelect}
      className="rounded-lg px-2.5 py-[7px] text-sm text-[#101114] hover:bg-(--surface-2)! focus-visible:bg-(--surface-2)!"
    >
      <span className="flex items-center gap-2">
        <HugeiconsIcon
          icon={icon}
          size={15}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <span>{label}</span>
      </span>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={13}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </DropdownItem>
  );
}

function AttachmentPreviewList({
  attachments,
  className,
  onRemove,
}: {
  attachments: PromptAttachment[];
  className?: string;
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className={cx("flex flex-wrap gap-2", className)}>
      {attachments.map((attachment) =>
        attachment.url ? (
          <div
            key={attachment.id}
            className="group relative h-16 w-16 overflow-hidden rounded-lg shadow-madoo-border"
          >
            <button
              type="button"
              onClick={() =>
                window.open(
                  attachment.url!,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              aria-label={`Open ${attachment.file.name}`}
              className="block h-full w-full cursor-pointer"
            >
              <img
                src={attachment.url}
                alt={attachment.file.name}
                className="h-full w-full object-cover"
              />
            </button>
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              aria-label={`Remove ${attachment.file.name}`}
              className="absolute right-1 top-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition hover:bg-black group-hover:opacity-100"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={11}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </div>
        ) : (
          <div
            key={attachment.id}
            className="flex max-w-56 items-center gap-2 rounded-lg bg-white px-2.5 py-2 shadow-madoo-border"
          >
            <HugeiconsIcon
              icon={Attachment01Icon}
              size={15}
              strokeWidth={1.8}
              className="shrink-0 text-[#101114]"
              aria-hidden="true"
            />
            <span className="min-w-0 truncate text-xs text-[#101114]">
              {attachment.file.name}
            </span>
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              aria-label={`Remove ${attachment.file.name}`}
              className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-[#101114]"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={12}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </div>
        ),
      )}
    </div>
  );
}

export { AttachMenu, AttachMenuItem, AttachmentPreviewList };
