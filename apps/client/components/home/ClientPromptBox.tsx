"use client";

import {
  Add01Icon,
  Alert02Icon,
  ArrowUp01Icon,
  Camera01Icon,
  Cancel01Icon,
  Image01Icon,
  BalloonIcon,
  CakeIcon,
  ChampionIcon,
  Diamond01Icon,
  Discount01Icon,
  FlashIcon,
  GiftCard02Icon,
  Leaf01Icon,
  Megaphone01Icon,
  Mic02Icon,
  QuillWrite01Icon,
  SourceCodeIcon,
  SparklesIcon,
  StopIcon,
  SunriseIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { fetchBillingOverview } from "@/actions/billing";
import { fetchSkills } from "@/actions/skills";
import { cn } from "@/lib/utils";
import { buildLandingAuthUrl } from "@/lib/auth-redirect";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import {
  Button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  Tooltip,
  useToast,
} from "@madoo/design-system";
import {
  MAX_PROMPT_SKILLS,
  PLAN_DISPLAY_NAMES,
  getRecommendedUpgradePlan,
} from "@madoo/shared";
import { useRouter } from "next/navigation";
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const placeholders = [
  "draft an email template for a product launch with a clear CTA...",
  "turn this campaign idea into a polished, responsive email layout...",
  "shape the copy and structure for a newsletter that is easy to scan...",
  "build an email template that fits the audience and brand voice...",
] as const;

/**
 * Picker icon per skill. Kept on the client because icons are presentation:
 * the backend catalog stays free of any component-library coupling. Unknown
 * ids fall back to the generic sparkles mark, so a new skill still renders.
 */
const SKILL_ICONS: Record<string, IconSvgElement> = {
  arc_section_edge: SunriseIcon,
  promo_code_pill: Discount01Icon,
  top_announcement_bar: Megaphone01Icon,
  footer_offer_panel: GiftCard02Icon,
  bold_retail: FlashIcon,
  editorial_serif: QuillWrite01Icon,
  modern_tech: SourceCodeIcon,
  luxury_minimal: Diamond01Icon,
  friendly_consumer: CakeIcon,
  organic_wellness: Leaf01Icon,
  neo_grotesque: ChampionIcon,
  playful: BalloonIcon,
};

const skillIcon = (name: string): IconSvgElement =>
  SKILL_ICONS[name] ?? SparklesIcon;

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

// Pull image files out of a clipboard payload (covers both the FileList and the
// item-based shapes browsers use for "copy image" / screenshot pastes).
function getClipboardImages(clipboardData: DataTransfer | null): File[] {
  if (!clipboardData) return [];

  const fromFiles = Array.from(clipboardData.files).filter((file) =>
    file.type.startsWith("image/"),
  );
  if (fromFiles.length > 0) return fromFiles;

  const images: File[] = [];
  for (const item of Array.from(clipboardData.items)) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) images.push(file);
    }
  }
  return images;
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
  /** While true, the send button becomes a Stop button that calls onStop. */
  isStreaming?: boolean;
  onStop?: () => void;
  /**
   * Externally-driven credit-limit warning (e.g. a daily-cap error from a failed
   * generation). When set, the floating yellow alert above the box shows this
   * message with the Upgrade link instead of surfacing as a red chat error.
   */
  creditLimitMessage?: string | null;
  onDismissCreditLimit?: () => void;
};

export type PromptSubmitInput = {
  prompt: string;
  images?: File[];
  /** Design skill ids picked in the composer, applied to this turn. */
  skills?: string[];
};

type PromptImage = {
  id: string;
  file: File;
  url: string;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function ClientPromptBox({
  className,
  classNames,
  disabled = false,
  onSubmit,
  variant = "home",
  isStreaming = false,
  onStop,
  creditLimitMessage = null,
  onDismissCreditLimit,
}: ClientPromptBoxProps) {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const searchCommandOpen = useClientStore((state) => state.searchCommandOpen);
  const setSidebarOpen = useClientStore((state) => state.setSidebarOpen);
  const setPricingOpen = useClientStore((state) => state.setPricingOpen);
  const setPendingPromptImages = useClientStore(
    (state) => state.setPendingPromptImages,
  );
  const workspaceId = useClientStore((state) => state.workspaceId);
  const [prompt, setPrompt] = useState("");
  const [creditsAlertDismissed, setCreditsAlertDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [skillMenuOpen, setSkillMenuOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [images, setImages] = useState<PromptImage[]>([]);
  const [previewImage, setPreviewImage] = useState<PromptImage | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voicePromptBaseRef = useRef("");
  const imagesRef = useRef<PromptImage[]>([]);
  imagesRef.current = images;
  const hasPrompt = prompt.trim().length > 0;
  const submitDisabled =
    disabled || isSubmitting || isListening || isTranscribing;
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
  // Static catalog — fetched once and cached for the session.
  const { data: skills = [] } = useQuery({
    queryKey: ["design-skills"],
    queryFn: fetchSkills,
    enabled: Boolean(user),
    staleTime: Infinity,
  });
  const skillsAtLimit = selectedSkills.length >= MAX_PROMPT_SKILLS;
  const toggleSkill = (name: string) =>
    setSelectedSkills((current) =>
      current.includes(name)
        ? current.filter((skill) => skill !== name)
        : current.length >= MAX_PROMPT_SKILLS
          ? current
          : [...current, name],
    );

  const aiUsage = billingOverview?.usage.aiGenerations;
  const currentPlan = billingOverview?.subscription.plan ?? "FREE";
  const recommendedUpgradePlan = getRecommendedUpgradePlan(currentPlan);
  const upgradeCtaLabel = recommendedUpgradePlan
    ? `Upgrade to ${PLAN_DISPLAY_NAMES[recommendedUpgradePlan]}`
    : null;
  const outOfCredits = Boolean(
    aiUsage && aiUsage.limit !== -1 && aiUsage.used >= aiUsage.limit,
  );
  // External credit-limit message (e.g. daily cap from a failed generation) wins
  // over the internal monthly check and shows its own text.
  const creditAlertMessage = creditLimitMessage
    ? creditLimitMessage
    : outOfCredits && !creditsAlertDismissed
      ? "Out of credits."
      : null;
  const showCreditsAlert = Boolean(creditAlertMessage);

  // Re-surface the alert whenever the workspace regains credits then runs out again.
  useEffect(() => {
    if (!outOfCredits) setCreditsAlertDismissed(false);
  }, [outOfCredits]);

  const addFiles = useCallback((files: FileList | File[] | null) => {
    if (!files) return;
    const next = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
        file,
        url: URL.createObjectURL(file),
      }));
    if (next.length) setImages((current) => [...current, ...next]);
  }, []);

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
    // Reset so picking the same file again still fires onChange.
    event.target.value = "";
  };

  const onPromptPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const imageFiles = getClipboardImages(event.clipboardData);
    if (imageFiles.length === 0) return; // Let text paste fall through natively.
    event.preventDefault();
    addFiles(imageFiles);
  };

  const removeImage = (id: string) => {
    setPreviewImage((current) => (current?.id === id ? null : current));
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

  const appendSpokenText = (text: string) => {
    const spokenText = text.trim();
    if (!spokenText) return;

    setPrompt((current) => {
      const basePrompt = voicePromptBaseRef.current.trim() || current.trim();
      const separator = basePrompt.length > 0 ? " " : "";
      return `${basePrompt}${separator}${spokenText}`;
    });
  };

  const cleanupMediaStream = () => {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  };

  const transcribeAudio = async (audio: Blob) => {
    if (!user) {
      toast({
        tone: "danger",
        title: "Sign in required",
        body: "Sign in to use microphone dictation in this browser.",
      });
      return;
    }

    setIsTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", audio, "speech.webm");
      const response = await fetch("/api/transcription", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json().catch(() => null)) as {
        text?: string;
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Transcription failed");
      }

      appendSpokenText(payload?.text ?? "");
    } catch (error) {
      toast({
        tone: "danger",
        title: "Microphone failed",
        body:
          error instanceof Error
            ? error.message
            : "Try again in a supported browser.",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
  };

  const startAudioRecordingFallback = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      toast({
        tone: "danger",
        title: "Microphone not supported",
        body: "Use Chrome, Edge, or Safari voice dictation.",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      voicePromptBaseRef.current = prompt;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const audio = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        mediaRecorderRef.current = null;
        cleanupMediaStream();
        if (audio.size > 0) void transcribeAudio(audio);
      };

      recorder.start();
      setIsListening(true);
      promptTextareaRef.current?.focus({ preventScroll: true });
    } catch {
      cleanupMediaStream();
      toast({
        tone: "danger",
        title: "Microphone failed",
        body: "Allow microphone access in your browser and try again.",
      });
    }
  };

  const startListening = () => {
    if (disabled || isSubmitting) return;

    if (
      recognitionRef.current ||
      mediaRecorderRef.current?.state === "recording"
    ) {
      stopListening();
      return;
    }

    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!Recognition) {
      void startAudioRecordingFallback();
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";
    recognitionRef.current = recognition;
    voicePromptBaseRef.current = prompt;

    recognition.onresult = (event) => {
      let transcript = "";

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        transcript += result?.[0]?.transcript ?? "";
      }

      appendSpokenText(transcript);
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setIsListening(false);
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed") {
        toast({
          tone: "danger",
          title: "Microphone failed",
          body: "Allow microphone access in your browser and try again.",
        });
        return;
      }

      void startAudioRecordingFallback();
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    try {
      recognition.start();
      setIsListening(true);
      promptTextareaRef.current?.focus({ preventScroll: true });
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      void startAudioRecordingFallback();
    }
  };

  // Close the image lightbox on Escape.
  useEffect(() => {
    if (!previewImage) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImage]);

  // Revoke any leftover object URLs when the box unmounts.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      mediaRecorderRef.current?.state === "recording" &&
        mediaRecorderRef.current.stop();
      cleanupMediaStream();
      for (const image of imagesRef.current) URL.revokeObjectURL(image.url);
    };
  }, []);

  const submitPrompt = async () => {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || submitDisabled) return;
    if (recognitionRef.current) stopListening();

    const input: PromptSubmitInput = { prompt: trimmedPrompt };
    const params = new URLSearchParams({ prompt: trimmedPrompt });

    if (images.length > 0) input.images = images.map((image) => image.file);
    if (selectedSkills.length > 0) input.skills = [...selectedSkills];

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
      setSelectedSkills([]);
      try {
        await onSubmit(input);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Navigation can't carry File objects in the URL, so hand them to the store
    // for the project page to upload and attach to the first generation.
    if (input.images?.length) setPendingPromptImages(input.images);
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

    const onPaste = (event: globalThis.ClipboardEvent) => {
      if (
        searchCommandOpen ||
        event.defaultPrevented ||
        shouldSkipPromptFocus(event.target)
      ) {
        return;
      }

      const imageFiles = getClipboardImages(event.clipboardData);
      if (imageFiles.length > 0) {
        event.preventDefault();
        focusPrompt();
        addFiles(imageFiles);
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
  }, [searchCommandOpen, addFiles]);

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
            <span className="font-medium">{creditAlertMessage}</span>
            {upgradeCtaLabel ? (
              <>
                {" "}
                <button
                  type="button"
                  onClick={() => setPricingOpen(true)}
                  className="cursor-pointer font-medium underline underline-offset-2 transition hover:opacity-70"
                >
                  {upgradeCtaLabel}
                </button>{" "}
                to keep generating.
              </>
            ) : (
              " You reached your plan credits."
            )}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (creditLimitMessage) onDismissCreditLimit?.();
              else setCreditsAlertDismissed(true);
            }}
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
            : "w-[calc(100vw-2rem)] rounded-3xl md:w-162.5 md:min-w-162.5 md:max-w-[calc(100vw-32px)]",
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
                <button
                  type="button"
                  data-madoo-control
                  onClick={() => setPreviewImage(image)}
                  aria-label={`Open ${image.file.name}`}
                  className="block h-full w-full cursor-pointer"
                >
                  <img
                    src={image.url}
                    alt={image.file.name}
                    className="h-full w-full object-cover"
                  />
                </button>
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

        {selectedSkills.length > 0 ? (
          <div
            className={cn(
              "flex flex-wrap gap-1.5 pb-1",
              isChatVariant ? "px-4 pt-3" : "px-5 pt-4",
            )}
          >
            {selectedSkills.map((name) => {
              const skill = skills.find((entry) => entry.name === name);
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-full bg-madoo-ink/[0.06] py-1 pl-2.5 pr-1.5 text-xs text-madoo-ink"
                >
                  <HugeiconsIcon
                    icon={skillIcon(name)}
                    size={12}
                    strokeWidth={1.8}
                    aria-hidden="true"
                  />
                  <span className="max-w-40 truncate">
                    {skill?.label ?? name}
                  </span>
                  <button
                    type="button"
                    data-madoo-control
                    onClick={() => toggleSkill(name)}
                    aria-label={`Remove ${skill?.label ?? name} skill`}
                    className="inline-flex size-4 cursor-pointer items-center justify-center rounded-full text-madoo-ink-muted transition hover:bg-white"
                  >
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={10}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}

        <textarea
          data-madoo-control
          ref={promptTextareaRef}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={onPromptKeyDown}
          onPaste={onPromptPaste}
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

              <DropdownContent
                side={isChatVariant ? "top" : "bottom"}
                align="start"
                className="min-w-44"
              >
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

            {skills.length > 0 ? (
              <Dropdown open={skillMenuOpen} onOpenChange={setSkillMenuOpen}>
                <button
                  type="button"
                  data-madoo-control
                  onClick={() => setSkillMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={skillMenuOpen}
                  aria-label="Choose design skills"
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs text-[#101114] transition hover:bg-[rgb(var(--rule-rgb)/0.06)]",
                    isChatVariant ? "h-7" : "h-8",
                    selectedSkills.length > 0 && "bg-[rgb(var(--rule-rgb)/0.08)]",
                  )}
                >
                  <HugeiconsIcon
                    icon={SparklesIcon}
                    size={isChatVariant ? 14 : 16}
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                  <span>
                    Skills
                    {selectedSkills.length > 0
                      ? ` (${selectedSkills.length})`
                      : ""}
                  </span>
                </button>

                <DropdownContent
                  side={isChatVariant ? "top" : "bottom"}
                  align="start"
                  className="max-h-88 w-80 overflow-y-auto"
                >
                  <p className="px-3 pb-1 pt-2 text-[11px] text-madoo-ink-muted">
                    {skillsAtLimit
                      ? `${MAX_PROMPT_SKILLS} skills max — deselect one to swap.`
                      : "Applied to your next message."}
                  </p>
                  {skills.map((skill) => {
                    const checked = selectedSkills.includes(skill.name);
                    const disabled = !checked && skillsAtLimit;
                    return (
                      <Tooltip
                        align="start"
                        content={skill.example}
                        key={skill.name}
                        side="right"
                        tone="ink"
                      >
                        <DropdownItem
                          disabled={disabled}
                          // DropdownItem closes on select unless the click's
                          // default is prevented — keep it open so several
                          // skills can be picked in one pass.
                          onClick={(event) => {
                            event.preventDefault();
                            if (!disabled) toggleSkill(skill.name);
                          }}
                          className="items-center gap-2.5"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <HugeiconsIcon
                              aria-hidden="true"
                              className="shrink-0 text-madoo-ink-muted"
                              icon={skillIcon(skill.name)}
                              size={17}
                              strokeWidth={1.6}
                            />
                            <span className="flex min-w-0 flex-col gap-0.5">
                              <span className="truncate font-medium">
                                {skill.label}
                              </span>
                              <span className="truncate text-[11px] leading-snug text-madoo-ink-muted">
                                {skill.summary}
                              </span>
                            </span>
                          </span>
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            size={15}
                            strokeWidth={2}
                            aria-hidden="true"
                            className={cn(
                              "shrink-0",
                              checked ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </DropdownItem>
                      </Tooltip>
                    );
                  })}
                </DropdownContent>
              </Dropdown>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startListening}
              disabled={disabled || isSubmitting || isTranscribing}
              className={cn(
                "inline-flex items-center justify-center rounded-full text-[#101114] transition",
                isListening
                  ? "cursor-pointer bg-black text-white hover:bg-black/80"
                  : disabled || isSubmitting || isTranscribing
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-[rgb(var(--rule-rgb)/0.06)]",
                isChatVariant ? "h-7 w-7" : "h-8 w-8",
              )}
              aria-pressed={isListening}
              aria-label={
                isListening
                  ? "Stop microphone"
                  : isTranscribing
                    ? "Transcribing microphone"
                    : "Use microphone"
              }
            >
              <HugeiconsIcon
                icon={Mic02Icon}
                size={isChatVariant ? 14 : 16}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </button>

            {isStreaming && onStop ? (
              <button
                type="button"
                onClick={onStop}
                className={cn(
                  "inline-flex cursor-pointer items-center justify-center rounded-full border border-madoo-border bg-transparent text-xs text-madoo-ink transition hover:bg-madoo-ink/[0.06]",
                  isChatVariant ? "h-7 w-7" : "h-8 px-4",
                )}
                aria-label="Stop generating"
              >
                {isChatVariant ? (
                  <HugeiconsIcon
                    icon={StopIcon}
                    size={15}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                ) : (
                  "Stop"
                )}
              </button>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      {previewImage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewImage.file.name}
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
        >
          <img
            src={previewImage.url}
            alt={previewImage.file.name}
            onClick={(event) => event.stopPropagation()}
            className="max-h-full max-w-full cursor-default rounded-xl object-contain shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
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
