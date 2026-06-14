"use client";

import {
  Add01Icon,
  ArrowUp01Icon,
  Mic02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { buildLandingAuthUrl } from "@/lib/auth-redirect";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import { Select } from "@madoo/design-system";
import { useRouter } from "next/navigation";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";

const promptOptions = [
  {
    label: "Tone",
    options: ["Friendly", "Professional", "Bold", "Luxury"],
    menuWidth: 160,
  },
  {
    label: "Length",
    options: ["Short", "Medium", "Long"],
    menuWidth: 144,
  },
] as const;

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
  showOptions?: boolean;
  variant?: "home" | "chat";
};

export type PromptSubmitInput = {
  prompt: string;
  tone?: string;
  length?: string;
  audience?: string;
};

export function ClientPromptBox({
  className,
  classNames,
  disabled = false,
  onSubmit,
  showOptions = true,
  variant = "home",
}: ClientPromptBoxProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const searchCommandOpen = useClientStore((state) => state.searchCommandOpen);
  const setSidebarOpen = useClientStore((state) => state.setSidebarOpen);
  const [prompt, setPrompt] = useState("");
  const [promptOptionValues, setPromptOptionValues] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const hasPrompt = prompt.trim().length > 0;
  const submitDisabled = disabled || isSubmitting;
  const isChatVariant = variant === "chat";
  const placeholderBody = useTypingPlaceholder(
    isChatVariant ? [] : placeholders,
  );
  const placeholder = isChatVariant
    ? "Write a message..."
    : `Hi Madoo ${placeholderBody}`;

  const submitPrompt = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || submitDisabled) return;

    const input: PromptSubmitInput = { prompt: trimmedPrompt };
    const params = new URLSearchParams({ prompt: trimmedPrompt });

    for (const [key, value] of Object.entries(promptOptionValues)) {
      const normalizedKey = key.toLowerCase() as "tone" | "length";
      if (value) {
        params.set(normalizedKey, value);
        input[normalizedKey] = value;
      }
    }

    if (!user) {
      window.location.assign(
        buildLandingAuthUrl(`/email-template-project?${params.toString()}`),
      );
      return;
    }

    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(input);
        setPrompt("");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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
              ? "min-h-14 rounded-t-2xl px-4 pr-8 pt-4"
              : "min-h-18 rounded-t-3xl px-5 pr-10 pt-5",
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
            <button
              type="button"
              className={cn(
                "inline-flex cursor-pointer items-center justify-center rounded-full text-[#101114] transition hover:bg-[#f3faff]",
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

            {showOptions ? (
              <div className="flex items-center gap-1.5">
                {promptOptions.map((option) => (
                  <Select
                    key={option.label}
                    value={promptOptionValues[option.label] ?? ""}
                    options={option.options}
                    placeholder={option.label}
                    menuTitle={option.label}
                    menuWidth={option.menuWidth}
                    size="sm"
                    variant="ghost"
                    onChange={(value) =>
                      setPromptOptionValues((current) => ({
                        ...current,
                        [option.label]: value,
                      }))
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "inline-flex cursor-pointer items-center justify-center rounded-full text-[#101114] transition hover:bg-[#f3faff]",
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
