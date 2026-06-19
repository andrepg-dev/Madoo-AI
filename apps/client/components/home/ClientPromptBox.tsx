"use client";

import {
  Add01Icon,
  Alert02Icon,
  ArrowUp01Icon,
  Camera01Icon,
  Cancel01Icon,
  Image01Icon,
  Mic02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { fetchBillingOverview } from "@/actions/billing";
import { cn } from "@/lib/utils";
import { buildLandingAuthUrl } from "@/lib/auth-redirect";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import {
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
} from "@madoo/design-system";
import { useRouter } from "next/navigation";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

const placeholders = [
  "draft an email template for a product launch with a clear CTA...",
  "turn this campaign idea into a polished, responsive email layout...",
  "shape the copy and structure for a newsletter that is easy to scan...",
  "build an email template that fits the audience and brand voice...",
] as const;

const placeholderTypingDelay = 46;
const placeholderDeletingDelay = 24;
const placeholderHoldDelay = 3600;
const placeholderRestartDelay = 520;
const ignoredPromptFocusSelector =
  "input, textarea, select, button, a, [contenteditable='true'], [data-madoo-control], [role='button'], [role='dialog'], [role='menu'], [role='listbox']";

function shouldSkipPromptFocus(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(ignoredPromptFocusSelector));
}

function useTypingPlaceholder(texts: readonly string[]) {
  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    if (texts.length === 0) {
      setPlaceholder("");
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaceholder(texts[0] ?? "");
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    let textIndex = 0;
    let characterIndex = 0;
    let isDeleting = false;

    const tick = () => {
      const text = texts[textIndex] ?? "";

      if (!isDeleting) {
        characterIndex = Math.min(characterIndex + 1, text.length);
        setPlaceholder(text.slice(0, characterIndex));

        if (characterIndex === text.length) {
          isDeleting = true;
          timeout = setTimeout(tick, placeholderHoldDelay);
          return;
        }

        timeout = setTimeout(tick, placeholderTypingDelay);
        return;
      }

      characterIndex = Math.max(characterIndex - 1, 0);
      setPlaceholder(text.slice(0, characterIndex));

      if (characterIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        timeout = setTimeout(tick, placeholderRestartDelay);
        return;
      }

      timeout = setTimeout(tick, placeholderDeletingDelay);
    };

    timeout = setTimeout(tick, placeholderTypingDelay);

    return () => clearTimeout(timeout);
  }, [texts]);

  return placeholder;
}

type ClientPromptBoxProps = {
  className?: string;
  classNames?: {
    root?: string;
    panel?: string;
    textarea?: string;
  };
  disabled?: boolean;
  onSubmit?: (input: PromptSubmitInput) => void | Promise<void>;
  variant?: "home" | "chat";
};

export type PromptSubmitInput = {
  prompt: string;
  tone?: string;
  length?: string;
  audience?: string;
  images?: File[];
};

type PromptImage = {
  id: string;
  file: File;
  url: string;
};

export function ClientPromptBox({
  className,
  classNames,
  disabled = false,
  onSubmit,
  variant = "home",
}: ClientPromptBoxProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const searchCommandOpen = useClientStore((state) => state.searchCommandOpen);
  const setSidebarOpen = useClientStore((state) => state.setSidebarOpen);
  const setPricingOpen = useClientStore((state) => state.setPricingOpen);
  const workspaceId = useClientStore((state) => state.workspaceId);
  const [prompt, setPrompt] = useState("");
  const [creditsAlertDismissed, setCreditsAlertDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [images, setImages] = useState<PromptImage[]>([]);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<PromptImage[]>([]);
  imagesRef.current = images;
  const hasPrompt = prompt.trim().length > 0;
  const submitDisabled = disabled || isSubmitting;
  const isChatVariant = variant === "chat";
  const placeholderBody = useTypingPlaceholder(
    isChatVariant ? [] : placeholders,
  );
  const placeholder = isChatVariant
    ? "Write a message..."
    : `Hi Madoo ${placeholderBody}`;

  const { data: billingOverview } = useQuery({
    queryKey: ["billing-overview", workspaceId],
    queryFn: fetchBillingOverview,
    enabled: Boolean(user),
  });
  const aiUsage = billingOverview?.usage.aiGenerations;
  const outOfCredits = Boolean(
    aiUsage && aiUsage.limit !== -1 && aiUsage.used >= aiUsage.limit,
  );
  const showCreditsAlert = outOfCredits && !creditsAlertDismissed;

  // Re-surface the alert whenever the workspace regains credits then runs out again.
  useEffect(() => {
    if (!outOfCredits) setCreditsAlertDismissed(false);
  }, [outOfCredits]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
      }));
    if (next.length) setImages((current) => [...current, ...next]);
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
    // Reset so picking the same file again still fires onChange.
    event.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((current) => {
      const target = current.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((image) => image.id !== id);
    });
  };

  const resetImages = () => {
    for (const image of imagesRef.current) URL.revokeObjectURL(image.url);
    setImages([]);
  };

  // Revoke any leftover object URLs when the box unmounts.
  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) URL.revokeObjectURL(image.url);
    };
  }, []);

  const submitPrompt = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || submitDisabled) return;

    const input: PromptSubmitInput = { prompt: trimmedPrompt };
    const params = new URLSearchParams({ prompt: trimmedPrompt });

    if (images.length > 0) input.images = images.map((image) => image.file);

    if (!user) {
      window.location.assign(
        buildLandingAuthUrl(`/email-template-project?${params.toString()}`),
      );
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      // Clear instantly so the message feels sent before the backend responds.
      setPrompt("");
      resetImages();
      try {
        await onSubmit(input);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Navigation can't carry File objects, so drop the previews before leaving.
    resetImages();
    setSidebarOpen(true);
    router.push(`/email-template-project?${params.toString()}`);
  };

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    void submitPrompt();
  };

  useEffect(() => {
    const textarea = promptTextareaRef.current;

    if (!textarea) return;

    const maxHeight = 320;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [prompt]);

  useEffect(() => {
    const focusPrompt = () => {
      const textarea = promptTextareaRef.current;
      if (!textarea) return;

      textarea.focus({ preventScroll: true });
      const end = textarea.value.length;
      textarea.setSelectionRange(end, end);
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        searchCommandOpen ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.length !== 1 ||
        event.key === "Dead" ||
        shouldSkipPromptFocus(event.target)
      ) {
        return;
      }

      event.preventDefault();
      focusPrompt();
      setPrompt((current) => `${current}${event.key}`);
    };

    const onPaste = (event: ClipboardEvent) => {
      if (
        searchCommandOpen ||
        event.defaultPrevented ||
        shouldSkipPromptFocus(event.target)
      ) {
        return;
      }

      const pastedText = event.clipboardData?.getData("text");
      if (!pastedText) return;

      event.preventDefault();
      focusPrompt();
      setPrompt((current) => `${current}${pastedText}`);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("paste", onPaste);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("paste", onPaste);
    };
  }, [searchCommandOpen]);

  return (
    <div
      className={cn(
        "relative z-[60] flex flex-col gap-2",
        className,
        classNames?.root,
      )}
    >
      {showCreditsAlert ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg bg-madoo-warn-soft px-2.5 py-1.5 font-madoo-sans text-[12.5px] leading-[1.5] text-madoo-warn shadow-madoo-border"
        >
          <HugeiconsIcon
            icon={Alert02Icon}
            size={15}
            strokeWidth={1.8}
            className="shrink-0"
            aria-hidden="true"
          />
          <p className="min-w-0 flex-1">
            <span className="font-medium">Out of credits.</span>{" "}
            <button
              type="button"
              onClick={() => setPricingOpen(true)}
              className="cursor-pointer font-medium underline underline-offset-2 transition hover:opacity-70"
            >
              Upgrade plan
            </button>{" "}
            to keep generating.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCreditsAlertDismissed(true)}
            aria-label="Dismiss out of credits alert"
            className="-mr-1 h-6 w-6 shrink-0 p-0!"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={14}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          "overflow-visible",
          !classNames?.panel &&
            "madoo-paper-border bg-[color-mix(in_srgb,var(--surface)_66%,var(--accent-soft))] shadow-[var(--shadow-border),0_0_0_1px_rgb(var(--rule-rgb)/0.12)]!",
          isChatVariant
            ? "w-full min-w-0 max-w-full rounded-2xl"
            : "min-w-162.5 max-w-[calc(100vw-32px)] rounded-3xl",
          classNames?.panel,
        )}
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={onFileInputChange}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={onFileInputChange}
        />

        {images.length > 0 ? (
          <div
            className={cn(
              "flex flex-wrap gap-2 pb-1",
              isChatVariant ? "px-4 pt-4" : "px-5 pt-5",
            )}
          >
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative h-16 w-16 overflow-hidden rounded-lg shadow-madoo-border"
              >
                <img
                  src={image.url}
                  alt={image.file.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  aria-label={`Remove ${image.file.name}`}
                  className="absolute right-1 top-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/65 text-white transition hover:bg-black"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={11}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <textarea
          data-madoo-control
          ref={promptTextareaRef}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={onPromptKeyDown}
          placeholder={hasPrompt ? "" : placeholder}
          className={cn(
            "madoo-prompt-textarea mr-3 max-h-80 w-[calc(100%-0.75rem)] resize-none bg-transparent text-sm text-[#101114] outline-none placeholder:text-[#4b5563]!",
            isChatVariant
              ? "min-h-14 rounded-t-2xl px-4 pr-8"
              : "min-h-18 rounded-t-3xl px-5 pr-10",
            // Drop the top padding when previews already supply the top gap.
            images.length > 0 ? "pt-2" : isChatVariant ? "pt-4" : "pt-5",
            classNames?.textarea,
          )}
        />

        <div
          className={cn(
            "flex items-center justify-between px-3.5 pb-3",
            isChatVariant && "gap-2",
          )}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Dropdown open={attachMenuOpen} onOpenChange={setAttachMenuOpen}>
              <button
                type="button"
                onClick={() => setAttachMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={attachMenuOpen}
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center rounded-full text-[#101114] transition hover:bg-[rgb(var(--rule-rgb)/0.06)]",
                  isChatVariant ? "h-7 w-7" : "h-8 w-8",
                )}
                aria-label="Add attachment"
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  size={isChatVariant ? 16 : 18}
                  strokeWidth={1}
                  aria-hidden="true"
                />
              </button>

              <DropdownContent side="bottom" align="start" className="min-w-44">
                <DropdownItem onSelect={() => imageInputRef.current?.click()}>
                  <span>Upload image</span>
                  <HugeiconsIcon
                    icon={Image01Icon}
                    size={16}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </DropdownItem>
                <DropdownItem onSelect={() => cameraInputRef.current?.click()}>
                  <span>Take photo</span>
                  <HugeiconsIcon
                    icon={Camera01Icon}
                    size={16}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "inline-flex cursor-pointer items-center justify-center rounded-full text-[#101114] transition hover:bg-[rgb(var(--rule-rgb)/0.06)]",
                isChatVariant ? "h-7 w-7" : "h-8 w-8",
              )}
              aria-label="Use microphone"
            >
              <HugeiconsIcon
                icon={Mic02Icon}
                size={isChatVariant ? 14 : 16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() => void submitPrompt()}
              disabled={!hasPrompt || submitDisabled}
              className={cn(
                "inline-flex items-center justify-center rounded-full text-xs text-white transition",
                hasPrompt && !submitDisabled
                  ? "cursor-pointer bg-black"
                  : "cursor-not-allowed bg-[#7d7d7a] opacity-80",
                isChatVariant ? "h-7 w-7" : "h-8 px-4",
              )}
              aria-label="Generate email"
            >
              {isChatVariant ? (
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  size={14}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              ) : (
                "Generate email"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
