"use client";

import { Add01Icon, Mic02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Select } from "@madoo/design-system";
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
  "create an email template for my AWS Summit event. Use this link for details: link.com",
  "turn this product update into a short newsletter for our subscribers.",
  "make a campaign email for our new feature launch. Target active users and drive trials.",
  "create a marketer-ready promo email for a limited offer with a clear CTA.",
] as const;

const placeholderTypingDelay = 36;
const placeholderDeletingDelay = 18;
const placeholderHoldDelay = 3200;
const placeholderRestartDelay = 420;

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

export function ClientPromptBox() {
  const [prompt, setPrompt] = useState("");
  const [promptOptionValues, setPromptOptionValues] = useState<
    Record<string, string>
  >({});
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const hasPrompt = prompt.trim().length > 0;
  const placeholderBody = useTypingPlaceholder(placeholders);
  const placeholder = `Hi Madoo, ${placeholderBody}`;

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
    }
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

  return (
    <div className="relative z-[60] flex flex-col gap-2">
      <div className="madoo-paper-border min-w-[650px] max-w-[calc(100vw-32px)] overflow-visible rounded-3xl bg-[color-mix(in_srgb,var(--surface)_84%,var(--accent-soft))]">
        <textarea
          data-madoo-control
          ref={promptTextareaRef}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={onPromptKeyDown}
          placeholder={hasPrompt ? "" : placeholder}
          className="madoo-prompt-textarea mr-3 max-h-80 min-h-18 w-[calc(100%-0.75rem)] resize-none rounded-t-3xl bg-transparent px-5 pr-10 pt-5 text-sm text-[#101114] outline-none placeholder:text-[#4b5563]"
        />

        <div className="flex items-center justify-between px-3.5 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#101114] transition hover:bg-[#f3faff]"
              aria-label="Add attachment"
            >
              <HugeiconsIcon
                icon={Add01Icon}
                size={18}
                strokeWidth={1}
                aria-hidden="true"
              />
            </button>

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
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#101114] transition hover:bg-[#f3faff]"
              aria-label="Use microphone"
            >
              <HugeiconsIcon
                icon={Mic02Icon}
                size={16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-4 text-xs text-white transition ${hasPrompt ? "bg-black" : "bg-[#7d7d7a] hover:bg-[#666663]"
                }`}
              aria-label="Generate email"
            >
              Generate email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
