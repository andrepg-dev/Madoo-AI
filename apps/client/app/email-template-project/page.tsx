"use client";

import {
  createEmail,
  fetchEmail,
  fetchEmailChat,
  setEmailChatMessageFeedback,
  truncateEmailChat,
  uploadEmailImage,
} from "@/actions/emails";
import { consumePendingPrompt } from "@/actions/prompts";
import type { PromptSubmitInput } from "@/components/home/ClientPromptBox";
import { ClientPromptBox } from "@/components/home/ClientPromptBox";
import { PreviewOverlay } from "@/components/project/preview/PreviewOverlay";
import { TestingModal } from "@/components/project/testing/TestingModal";
import { PricingDrawer } from "@/components/shell/PricingDrawer";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { usePreviewLayout } from "@/hooks/use-preview-layout";
import { AiMessage } from "@/components/project/editor/AiMessage";
import { ConversationTitleDropdown } from "@/components/project/editor/ConversationTitleDropdown";
import { DislikeFeedbackModal } from "@/components/project/editor/DislikeFeedbackModal";
import { EmailPreviewSidebar } from "@/components/project/editor/EmailPreviewSidebar";
import { ErrorMessage } from "@/components/project/editor/ErrorMessage";
import { ExportProviderModal } from "@/components/project/editor/ExportProviderModal";
import { HumanMessage } from "@/components/project/editor/HumanMessage";
import { StatusMessage } from "@/components/project/editor/StatusMessage";
import { TimelineMessage } from "@/components/project/editor/TimelineMessage";
import {
  appendTimelineStep,
  applyAiMessageFeedback,
  createTimelineMessage,
  deriveConversationTitle,
  finishTimeline,
  latestVariant,
  mapChatMessages,
  upsertMessage,
} from "@/components/project/editor/chat-utils";
import type {
  AiMessageFeedback,
  ChatMessage,
} from "@/components/project/editor/types";
import {
  consumeEmailSseStream,
  type StreamEmailEvent,
} from "@/lib/email-stream";
import { highlightMergeTags } from "@/lib/highlight-merge-tags";
import { playCompletionSound } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { useClientStore } from "@/stores/client-store";
import { ArrowDown02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, useToast } from "@madoo/design-system";
import type { EmailChatMessageDto } from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "streamdown/styles.css";
import posthog from "posthog-js";

function EmailTemplateProjectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const sidebarOpen = useClientStore((state) => state.sidebarOpen);
  const setSidebarOpen = useClientStore((state) => state.setSidebarOpen);
  const pricingOpen = useClientStore((state) => state.pricingOpen);
  const setPricingOpen = useClientStore((state) => state.setPricingOpen);
  const [currentEmailId, setCurrentEmailId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    mapChatMessages(undefined, null),
  );
  const [streamedHtml, setStreamedHtml] = useState<string | null>(null);
  const [streamedSubject, setStreamedSubject] = useState<string | null>(null);
  const [streamedConversationTitle, setStreamedConversationTitle] = useState<
    string | null
  >(null);
  const [isStreaming, setIsStreaming] = useState(false);
  // Which response version is shown per regenerated group (groupId → index).
  const [selectedVersions, setSelectedVersions] = useState<
    Record<string, number>
  >({});
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [testingModalOpen, setTestingModalOpen] = useState(false);
  const [dislikeTarget, setDislikeTarget] = useState<string | null>(null);
  // On narrow screens the chat and preview share one column via a tab toggle.
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");
  const [isNarrowEditor, setIsNarrowEditor] = useState(false);
  const processedStartupRef = useRef<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsNarrowEditor(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const {
    messagesRef,
    latestUserRef,
    canScrollDown,
    updateScrollState,
    scrollToBottom,
    requestUserScroll,
  } = useChatScroll(currentEmailId, messages);

  const {
    mode: previewMode,
    setMode: setPreviewMode,
    theme: templateTheme,
    setTheme: setTemplateTheme,
    width: previewWidth,
    setWidth: updatePreviewWidth,
    expanded: previewExpanded,
    toggleExpanded: togglePreviewExpanded,
    collapse: collapsePreview,
    overlayOpen: previewOverlayOpen,
    setOverlayOpen: setPreviewOverlayOpen,
  } = usePreviewLayout();

  const emailQuery = useQuery({
    queryKey: ["email", currentEmailId],
    queryFn: () => fetchEmail(currentEmailId!),
    enabled: Boolean(currentEmailId),
  });
  const chatQuery = useQuery({
    queryKey: ["email-chat", currentEmailId],
    queryFn: () => fetchEmailChat(currentEmailId!),
    enabled: Boolean(currentEmailId),
  });

  const feedbackMutation = useMutation({
    mutationFn: (input: {
      messageId: string;
      feedback: AiMessageFeedback | null;
      comment?: string;
    }) =>
      setEmailChatMessageFeedback(currentEmailId!, input.messageId, {
        feedback: input.feedback,
        ...(input.comment !== undefined ? { comment: input.comment } : {}),
      }),
    onMutate: (input) => {
      if (input.feedback) {
        posthog.capture("email_feedback_submitted", {
          email_id: currentEmailId,
          message_id: input.messageId,
          feedback: input.feedback,
        });
      }
      setMessages((current) =>
        applyAiMessageFeedback(current, input.messageId, input.feedback),
      );
    },
    onSuccess: (updated) => {
      const nextFeedback = updated.feedback ?? null;
      setMessages((current) =>
        applyAiMessageFeedback(current, updated.id, nextFeedback),
      );
      queryClient.setQueryData<EmailChatMessageDto[] | undefined>(
        ["email-chat", currentEmailId],
        (current) =>
          current?.map((message) =>
            message.id === updated.id ? { ...message, ...updated } : message,
          ),
      );
    },
    onError: (_error, input) => {
      void chatQuery.refetch();
      setMessages((current) =>
        applyAiMessageFeedback(current, input.messageId, null),
      );
      toast({
        tone: "danger",
        title: "Feedback not saved",
        body: "Try again.",
      });
    },
  });

  const email = emailQuery.data;
  const variant = latestVariant(email);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  // The version shown in the preview: a picked older variant, else the latest.
  const activeVariant =
    email?.variants.find((item) => item.id === selectedVariantId) ?? variant;
  // Jump back to the newest version whenever a new edit produces one.
  const latestVariantId = variant?.id;
  useEffect(() => {
    setSelectedVariantId(null);
  }, [latestVariantId]);

  const previewSrcDoc = streamedHtml ?? activeVariant?.compiledHtml ?? null;
  const hasPreview = Boolean(previewSrcDoc);
  const highlightedPreviewSrcDoc = useMemo(
    () => highlightMergeTags(previewSrcDoc),
    [previewSrcDoc],
  );
  const previewSubject =
    streamedSubject ?? activeVariant?.subject ?? "Untitled email";
  const storedConversationTitle =
    email?.title && email.title !== variant?.subject ? email.title : null;
  const conversationTitle =
    streamedConversationTitle ??
    storedConversationTitle ??
    deriveConversationTitle(messages, "New conversation");
  const startupKey = useMemo(() => searchParams.toString(), [searchParams]);

  const invalidateEmailState = useCallback(
    async (emailId: string) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["email", emailId] }),
        queryClient.invalidateQueries({ queryKey: ["email-chat", emailId] }),
        queryClient.invalidateQueries({ queryKey: ["emails"] }),
        queryClient.invalidateQueries({ queryKey: ["billing-overview"] }),
      ]);
    },
    [queryClient],
  );

  const startStream = useCallback(
    async (
      emailId: string,
      mode: "generate" | "edit" | "regenerate",
      instruction?: string,
      baseVariantId?: string,
      imageUrls?: string[],
    ) => {
      const assistantId = `${mode}-${Date.now()}-assistant`;
      const timeline = createTimelineMessage(
        emailId,
        mode === "generate"
          ? "Starting generation…"
          : mode === "regenerate"
            ? "Regenerating…"
            : "Applying your edits…",
      );
      const timelineId = timeline.id;
      let assistantText = "";
      let thinkingText = "";
      let thinkingStartedAt: number | null = null;
      let thinkingFinishedAt: number | null = null;

      const upsertAssistant = (current: ChatMessage[]) =>
        upsertMessage(current, {
          id: assistantId,
          role: "assistant",
          content: assistantText,
          seq: Date.now(),
          emailId,
          thinking: thinkingText || undefined,
          thinkingSeconds: thinkingStartedAt
            ? Math.max(
              1,
              Math.round(
                ((thinkingFinishedAt ?? Date.now()) - thinkingStartedAt) /
                1000,
              ),
            )
            : undefined,
          thinkingActive:
            thinkingStartedAt !== null && thinkingFinishedAt === null,
        });

      setIsStreaming(true);
      // Append the live timeline; the user's message is already on screen.
      setMessages((current) => [...current, timeline]);

      const showTimelineProgress = (label: string) => {
        if (thinkingStartedAt !== null && thinkingFinishedAt === null) {
          thinkingFinishedAt = Date.now();
        }
        setMessages((current) =>
          thinkingText || assistantText
            ? upsertAssistant(appendTimelineStep(current, timelineId, label))
            : appendTimelineStep(current, timelineId, label),
        );
      };

      const handleEvent = (event: StreamEmailEvent) => {
        if (event.type === "step") {
          showTimelineProgress(event.message);
          return;
        }

        if (event.type === "thinking-chunk") {
          thinkingText += event.value;
          const firstChunk = thinkingStartedAt === null;
          if (firstChunk) thinkingStartedAt = Date.now();
          // Once reasoning starts, the "Thought for Ns" block is the indicator —
          // drop the loading spinner above it.
          setMessages((current) =>
            upsertAssistant(
              firstChunk ? finishTimeline(current, timelineId) : current,
            ),
          );
          return;
        }

        if (event.type === "assistant-chunk") {
          const firstChunk = assistantText.length === 0;
          assistantText += event.value;
          // First visible answer token marks the end of the reasoning phase.
          if (thinkingStartedAt !== null && thinkingFinishedAt === null) {
            thinkingFinishedAt = Date.now();
          }
          setMessages((current) =>
            upsertAssistant(
              firstChunk ? finishTimeline(current, timelineId) : current,
            ),
          );
          return;
        }

        if (event.type === "subject") {
          setStreamedSubject(event.value);
          return;
        }

        if (event.type === "conversation_title") {
          setStreamedConversationTitle(event.value);
          return;
        }

        if (event.type === "code-chunk") {
          showTimelineProgress("Writing the email template…");
          return;
        }

        if (event.type === "preview_url") {
          showTimelineProgress("Preview image ready");
          return;
        }

        if (event.type === "done") {
          playCompletionSound();
          if (thinkingStartedAt !== null && thinkingFinishedAt === null) {
            thinkingFinishedAt = Date.now();
          }
          if (event.compiledHtml) {
            setStreamedHtml(event.compiledHtml);
            setSidebarOpen(true);
            // Reveal the freshly generated email on narrow screens.
            if (window.matchMedia("(max-width: 1023px)").matches) {
              setMobileTab("preview");
            }
          }
          if (event.subject) setStreamedSubject(event.subject);
          if (event.conversationTitle) {
            setStreamedConversationTitle(event.conversationTitle);
          }
          // Keep the timeline in the conversation as a record; finalize it.
          setMessages((current) => {
            const finished = finishTimeline(current, timelineId);
            if (assistantText.trim()) return finished;
            return upsertMessage(finished, {
              id: assistantId,
              role: "assistant",
              content: event.chatOnly
                ? "I added guidance to the conversation."
                : `Generated email${event.subject ? `: ${event.subject}` : "."}`,
              seq: Date.now(),
              emailId,
              thinking: thinkingText || undefined,
              thinkingSeconds: thinkingStartedAt
                ? Math.max(
                  1,
                  Math.round(
                    ((thinkingFinishedAt ?? Date.now()) - thinkingStartedAt) /
                    1000,
                  ),
                )
                : undefined,
            });
          });
          return;
        }

        if (event.type === "error") {
          setMessages((current) =>
            upsertMessage(finishTimeline(current, timelineId), {
              id: `${mode}-${Date.now()}-error`,
              role: "error",
              content: event.message,
              seq: Date.now(),
              emailId,
            }),
          );
        }
      };

      try {
        const hasImages = (imageUrls?.length ?? 0) > 0;
        const requestBody =
          mode === "edit"
            ? JSON.stringify({
              instruction: instruction ?? "",
              ...(baseVariantId ? { baseVariantId } : {}),
              ...(hasImages ? { imageUrls } : {}),
            })
            : mode === "generate" && ((instruction?.trim().length ?? 0) > 0 || hasImages)
              ? JSON.stringify({
                ...(instruction?.trim() ? { prompt: instruction.trim() } : {}),
                ...(hasImages ? { imageUrls } : {}),
              })
              : undefined;
        await consumeEmailSseStream(
          `/api/emails/${emailId}/${mode}`,
          handleEvent,
          undefined,
          requestBody,
        );
        await invalidateEmailState(emailId);
      } catch (error) {
        setMessages((current) =>
          upsertMessage(finishTimeline(current, timelineId), {
            id: `${mode}-${Date.now()}-error`,
            role: "error",
            content:
              error instanceof Error ? error.message : "Email stream failed.",
            seq: Date.now(),
            emailId,
          }),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [invalidateEmailState, setSidebarOpen],
  );

  const submitChatPrompt = useCallback(
    async (input: PromptSubmitInput) => {
      if (isStreaming) return;
      const files = input.images ?? [];
      // Local previews for attached images (display only — not yet persisted).
      const previewUrls = files.map((file) => URL.createObjectURL(file));
      // Render the user's message immediately — never wait on the backend save.
      setMessages((current) => [
        ...current,
        {
          id: `user-${Date.now()}`,
          role: "user",
          content: input.prompt,
          seq: Date.now(),
          emailId: currentEmailId ?? undefined,
          images: previewUrls.length > 0 ? previewUrls : undefined,
        },
      ]);
      // Pin the new message to the top of the chat (its reserved response area
      // below gives it the room to get there).
      requestUserScroll();

      // Upload attachments to S3 so the AI can see them and reuse their URLs as
      // <Img src> inside the email. Best-effort: a failed upload still streams.
      const uploadImages = async (emailId: string): Promise<string[]> => {
        if (files.length === 0) return [];
        try {
          return await Promise.all(
            files.map((file) => {
              const form = new FormData();
              form.append("file", file);
              return uploadEmailImage(emailId, form);
            }),
          );
        } catch {
          return [];
        }
      };

      if (currentEmailId) {
        const uploaded = await uploadImages(currentEmailId);
        const shouldGenerateInitialVariant =
          Boolean(email) && (email?.variants.length ?? 0) === 0;
        if (!shouldGenerateInitialVariant) {
          posthog.capture("email_edit_submitted", {
            email_id: currentEmailId,
            has_images: (input.images?.length ?? 0) > 0,
          });
          await startStream(
            currentEmailId,
            "edit",
            input.prompt,
            variant?.id,
            uploaded,
          );
        } else {
          posthog.capture("email_generation_started", {
            email_id: currentEmailId,
            continued_after_chat_only: true,
            has_images: (input.images?.length ?? 0) > 0,
          });
          await startStream(
            currentEmailId,
            "generate",
            input.prompt,
            undefined,
            uploaded,
          );
        }
        return;
      }

      try {
        const created = await createEmail({
          prompt: input.prompt,
          tone: input.tone,
          length: input.length,
          audience: input.audience,
        });
        posthog.capture("email_generation_started", {
          email_id: created.id,
          has_tone: Boolean(input.tone),
          has_length: Boolean(input.length),
          has_audience: Boolean(input.audience),
          has_images: (input.images?.length ?? 0) > 0,
        });
        setCurrentEmailId(created.id);
        router.replace(`/email-template-project?id=${created.id}`);
        const uploaded = await uploadImages(created.id);
        await startStream(created.id, "generate", undefined, undefined, uploaded);
      } catch (error) {
        posthog.captureException(error);
        setMessages((current) => [
          ...current,
          {
            id: `create-${Date.now()}-error`,
            role: "error",
            content:
              error instanceof Error
                ? error.message
                : "Could not create email project.",
          },
        ]);
      }
    },
    [
      currentEmailId,
      email,
      isStreaming,
      router,
      startStream,
      variant?.id,
    ],
  );

  // In-place edit: drop the edited turn and everything after it, then re-run the
  // corrected instruction so the conversation continues from that point.
  const editMessage = useCallback(
    async (message: ChatMessage, text: string) => {
      if (isStreaming || !currentEmailId) return;

      setMessages((current) => {
        const index = current.findIndex((item) => item.id === message.id);
        return index === -1 ? current : current.slice(0, index);
      });

      const from = new Date(message.seq ?? Date.now()).toISOString();
      try {
        await truncateEmailChat(currentEmailId, from);
      } catch {
        // Best-effort: even if truncation fails, still re-send the instruction.
      }

      await submitChatPrompt({ prompt: text });
    },
    [currentEmailId, isStreaming, submitChatPrompt],
  );

  // Re-run the latest turn, keeping the previous answer as a navigable version.
  const regenerate = useCallback((message: ChatMessage) => {
    if (isStreaming || !currentEmailId) return;
    posthog.capture("email_regenerated", { email_id: currentEmailId });
    if (message.groupId) {
      setSelectedVersions((current) => {
        const { [message.groupId!]: _removed, ...rest } = current;
        return rest;
      });
    }
    setMessages((current) => current.filter((item) => item.id !== message.id));
    void startStream(currentEmailId, "regenerate");
  }, [currentEmailId, isStreaming, startStream]);

  const selectVersion = useCallback((groupId: string, index: number) => {
    setSelectedVersions((current) => ({ ...current, [groupId]: index }));
  }, []);

  useEffect(() => {
    if (!currentEmailId || email?.status !== "GENERATING" || isStreaming) {
      return;
    }
    const interval = window.setInterval(() => {
      void emailQuery.refetch();
      void chatQuery.refetch();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [chatQuery, currentEmailId, email?.status, emailQuery, isStreaming]);

  useEffect(() => {
    setStreamedHtml(null);
    setStreamedSubject(null);
    setStreamedConversationTitle(null);
  }, [currentEmailId]);

  useEffect(() => {
    if (isStreaming) return;
    setMessages((previous) => {
      const server = mapChatMessages(chatQuery.data, email, selectedVersions);
      // Preserve client-only rows (the live/finished timeline and stream errors)
      // for the active email so they aren't wiped by the server refetch.
      const clientOnly = previous.filter(
        (message) =>
          (message.role === "timeline" || message.role === "error") &&
          (!currentEmailId || message.emailId === currentEmailId),
      );
      const merged = [...server, ...clientOnly].sort(
        (a, b) => (a.seq ?? 0) - (b.seq ?? 0),
      );
      // Guard against a transient refetch that hasn't yet returned the opening
      // user message (the email/chat queries can settle a beat after a fresh
      // generation). Never let a userless rebuild wipe a conversation that
      // already shows the user's message — otherwise the first bubble vanishes
      // and the title collapses to "New conversation". Scoped to the active
      // email so switching to another (possibly empty) project still resets.
      if (!merged.some((message) => message.role === "user")) {
        const keepsUserMessage = previous.some(
          (message) =>
            message.role === "user" &&
            (!message.emailId || message.emailId === currentEmailId),
        );
        if (keepsUserMessage) return previous;
      }
      return merged;
    });
  }, [chatQuery.data, currentEmailId, email, isStreaming, selectedVersions]);

  useEffect(() => {
    if (hasPreview) {
      setSidebarOpen(true);
      return;
    }
    setSidebarOpen(false);
    collapsePreview();
  }, [hasPreview, setSidebarOpen, collapsePreview]);

  useEffect(() => {
    if (!startupKey || processedStartupRef.current === startupKey) return;
    processedStartupRef.current = startupKey;

    const id = searchParams.get("id");
    if (id) {
      setCurrentEmailId(id);
      return;
    }

    const pendingPromptId = searchParams.get("pendingPromptId");
    if (pendingPromptId) {
      setMessages([
        {
          id: "pending-status",
          role: "status",
          content: "Loading your saved prompt...",
        },
      ]);
      void consumePendingPrompt(pendingPromptId)
        .then(async (pendingPrompt) => {
          if (!pendingPrompt.emailId) {
            throw new Error("Pending prompt did not create an email.");
          }
          setCurrentEmailId(pendingPrompt.emailId);
          router.replace(`/email-template-project?id=${pendingPrompt.emailId}`);
          setMessages([
            {
              id: `${pendingPrompt.emailId}-prompt`,
              role: "user",
              content: pendingPrompt.prompt,
            },
          ]);
          await invalidateEmailState(pendingPrompt.emailId);
          await new Promise((resolve) => window.setTimeout(resolve, 750));
          const existingEmail = await fetchEmail(pendingPrompt.emailId);
          queryClient.setQueryData(
            ["email", pendingPrompt.emailId],
            existingEmail,
          );
          if (
            existingEmail.status === "DRAFT" &&
            existingEmail.variants.length === 0
          ) {
            await startStream(pendingPrompt.emailId, "generate");
          }
        })
        .catch((error) => {
          setMessages([
            {
              id: "pending-error",
              role: "error",
              content:
                error instanceof Error
                  ? error.message
                  : "Could not load pending prompt.",
            },
          ]);
        });
      return;
    }

    const prompt = searchParams.get("prompt")?.trim();
    if (!prompt) return;

    const tone = searchParams.get("tone") ?? undefined;
    const length = searchParams.get("length") ?? undefined;
    const audience = searchParams.get("audience") ?? undefined;

    setMessages([
      { id: "new-prompt", role: "user", content: prompt, seq: Date.now() },
    ]);
    void createEmail({ prompt, tone, length, audience })
      .then(async (created) => {
        setCurrentEmailId(created.id);
        router.replace(`/email-template-project?id=${created.id}`);
        await startStream(created.id, "generate");
      })
      .catch((error) => {
        setMessages((current) => [
          ...current,
          {
            id: "create-error",
            role: "error",
            content:
              error instanceof Error
                ? error.message
                : "Could not create email project.",
          },
        ]);
      });
  }, [
    invalidateEmailState,
    queryClient,
    router,
    searchParams,
    startStream,
    startupKey,
  ]);

  const openStandalonePreview = useCallback(() => {
    if (!previewSrcDoc) {
      toast({
        tone: "danger",
        title: "No preview yet",
        body: "Generate an email before opening the preview.",
      });
      return;
    }

    const blob = new Blob([previewSrcDoc], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const previewWindow = window.open(url, "_blank");
    if (!previewWindow) {
      URL.revokeObjectURL(url);
      toast({
        tone: "danger",
        title: "Preview blocked",
        body: "Allow popups for Madoo and try again.",
      });
      return;
    }
    previewWindow.opener = null;
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [previewSrcDoc, toast]);

  const lastUserIndex = messages.reduce(
    (last, message, index) => (message.role === "user" ? index : last),
    -1,
  );
  // Only the most recent assistant response can be regenerated (it re-runs the
  // latest turn), mirroring the ChatGPT affordance.
  const lastAssistantId = messages.reduce<string | null>(
    (last, message) => (message.role === "assistant" ? message.id : last),
    null,
  );
  const renderMessage = (message: ChatMessage) => {
    if (message.role === "user") {
      return (
        <HumanMessage
          disabled={isStreaming}
          images={message.images}
          onEdit={(text) => void editMessage(message, text)}
        >
          {message.content}
        </HumanMessage>
      );
    }
    if (message.role === "error") {
      return <ErrorMessage>{message.content}</ErrorMessage>;
    }
    if (message.role === "status") {
      return <StatusMessage>{message.content}</StatusMessage>;
    }
    if (message.role === "timeline") {
      return <TimelineMessage message={message} />;
    }
    const feedbackVersion = message.versions?.[message.versionIndex ?? 0];
    const feedbackMessageId = feedbackVersion?.id ?? message.id;
    const feedback = feedbackVersion?.feedback ?? message.feedback ?? null;
    return (
      <AiMessage
        feedback={feedback}
        onFeedback={(nextFeedback) => {
          if (!currentEmailId || feedbackMutation.isPending) return;
          if (nextFeedback === "LIKE") {
            feedbackMutation.mutate(
              { messageId: feedbackMessageId, feedback: "LIKE" },
              {
                onSuccess: () =>
                  toast({
                    tone: "success",
                    title: "Thanks for your feedback",
                  }),
              },
            );
            return;
          }
          // Dislike: persist immediately (hides the buttons) and open the
          // modal asking the user what to improve.
          feedbackMutation.mutate({
            messageId: feedbackMessageId,
            feedback: "DISLIKE",
          });
          setDislikeTarget(feedbackMessageId);
        }}
        onRegenerate={
          message.id === lastAssistantId ? () => regenerate(message) : undefined
        }
        onSelectVersion={
          message.groupId
            ? (index) => selectVersion(message.groupId!, index)
            : undefined
        }
        regenerating={isStreaming}
        thinking={message.thinking}
        thinkingActive={message.thinkingActive}
        thinkingSeconds={message.thinkingSeconds}
        versionIndex={message.versionIndex}
        versions={message.versions}
      >
        {message.content}
      </AiMessage>
    );
  };
  // Everything up to and including the latest user message renders normally;
  // the response to that message lives in a reserved min-height area so the
  // user message can be scrolled to the top of the viewport on send.
  const headMessages =
    lastUserIndex === -1 ? [] : messages.slice(0, lastUserIndex + 1);
  const tailMessages =
    lastUserIndex === -1 ? messages : messages.slice(lastUserIndex + 1);

  return (
    <main className="relative flex h-screen flex-col overflow-hidden bg-white">
      <header
        className={cn(
          "fixed left-3 top-0 z-30 flex h-11 w-fit items-center bg-white transition-[opacity,transform]",
          hasPreview &&
          previewExpanded &&
          "pointer-events-none -translate-y-3 opacity-0",
          // On narrow screens hide the title while viewing the preview pane so
          // it doesn't overlap the preview's own header.
          hasPreview && mobileTab === "preview" && "hidden lg:flex",
        )}
      >
        <ConversationTitleDropdown
          title={conversationTitle}
          emailId={currentEmailId}
          starred={email?.starred ?? false}
        />
      </header>

      {/* Mobile-only toggle to switch the single column between chat and preview. */}
      {hasPreview && previewSrcDoc ? (
        <div className="z-30 flex shrink-0 items-center justify-center bg-white py-1.5 shadow-(--shadow-border-bottom-soft) lg:hidden">
          <div className="flex items-center gap-1 rounded-full bg-madoo-bg p-1 shadow-madoo-border">
            <button
              type="button"
              onClick={() => setMobileTab("chat")}
              className={cn(
                "rounded-full px-4 py-1 text-xs font-medium transition",
                mobileTab === "chat"
                  ? "bg-white text-madoo-ink shadow-madoo-border"
                  : "text-madoo-ink-muted",
              )}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={cn(
                "rounded-full px-4 py-1 text-xs font-medium transition",
                mobileTab === "preview"
                  ? "bg-white text-madoo-ink shadow-madoo-border"
                  : "text-madoo-ink-muted",
              )}
            >
              Preview
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* CHAT SECTION, (User messages, AI agent messages, date at the top, and so on...) */}
        <section
          className={cn(
            "flex min-w-0 flex-1 flex-col pb-4 pt-11 transition-opacity",
            hasPreview && previewExpanded && "pointer-events-none opacity-0",
            hasPreview && mobileTab === "preview" && "hidden lg:flex",
          )}
        >
          {/* messages */}
          <div
            ref={messagesRef}
            className="madoo-chat-scrollbar min-h-0 flex-1 overflow-y-auto pr-4 text-sm font-figtree pb-16"
            onScroll={updateScrollState}
          >
            <div className="mx-auto w-full max-w-2xl px-4">
              <div className="mt-8 flex flex-col">
                {headMessages.map((message, index) =>
                  index === lastUserIndex ? (
                    <div
                      className="flex scroll-mt-6 flex-col"
                      key={message.id}
                      ref={latestUserRef}
                    >
                      {renderMessage(message)}
                    </div>
                  ) : (
                    <Fragment key={message.id}>
                      {renderMessage(message)}
                    </Fragment>
                  ),
                )}
                <div className="flex min-h-100 flex-col gap-8">
                  {tailMessages.map((message) => (
                    <Fragment key={message.id}>
                      {renderMessage(message)}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-176 shrink-0 px-4">
            <div className="pointer-events-none absolute inset-x-4 -top-4 h-4 bg-linear-to-b from-white/0 via-white/80 to-white" />
            {canScrollDown ? (
              <Button
                aria-label="Scroll to latest message"
                className="absolute left-1/2 top-0 z-10 h-9 w-9 -translate-x-1/2 translate-y-[-150%] shadow-madoo-border rounded-full bg-white text-madoo-ink hover:bg-madoo-bg"
                onClick={scrollToBottom}
                size="sm"
                variant="icon"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ArrowDown02Icon}
                  primaryColor="currentColor"
                  size={18}
                  strokeWidth={1.6}
                />
              </Button>
            ) : null}
            <ClientPromptBox
              classNames={{
                root: "w-full",
                panel: "bg-madoo-bg shadow-[inset_0_0_0_0.75px_rgb(var(--ink-shadow-rgb)/0.18)]",
                textarea: "min-h-17 rounded-t-2xl px-4.5 pt-4.25",
              }}
              disabled={isStreaming || (Boolean(currentEmailId) && emailQuery.isLoading)}
              onSubmit={submitChatPrompt}
              variant="chat"
            />
          </div>
        </section>

        {hasPreview && previewSrcDoc ? (
          <div
            className={cn(
              "min-h-0 w-full lg:flex lg:w-auto lg:shrink-0",
              mobileTab === "preview" ? "flex" : "hidden lg:flex",
            )}
          >
            <EmailPreviewSidebar
              email={email}
              emailId={currentEmailId}
              expanded={previewExpanded}
              fullWidth={isNarrowEditor}
              mode={previewMode}
              onOpenExport={() => setExportModalOpen(true)}
              onOpenPreview={() => setPreviewOverlayOpen(true)}
              onOpenPricing={() => setPricingOpen(true)}
              onOpenTesting={() => setTestingModalOpen(true)}
              onSelectVersion={setSelectedVariantId}
              onToggleExpanded={togglePreviewExpanded}
              open={sidebarOpen}
              setMode={setPreviewMode}
              srcDoc={highlightedPreviewSrcDoc ?? ""}
              setTheme={setTemplateTheme}
              setWidth={updatePreviewWidth}
              subject={previewSubject}
              theme={templateTheme}
              variant={activeVariant}
              width={previewWidth}
            />
          </div>
        ) : null}
      </div>

      <PreviewOverlay
        onClose={() => setPreviewOverlayOpen(false)}
        onOpenInNewTab={openStandalonePreview}
        open={previewOverlayOpen && Boolean(previewSrcDoc)}
        srcDoc={previewSrcDoc ?? ""}
        subject={previewSubject}
      />

      <ExportProviderModal
        emailId={currentEmailId}
        onClose={() => setExportModalOpen(false)}
        open={exportModalOpen}
        variantId={variant?.id ?? null}
      />
      <PricingDrawer
        onClose={() => setPricingOpen(false)}
        open={pricingOpen}
      />
      <TestingModal
        emailId={currentEmailId}
        html={previewSrcDoc ?? ""}
        onClose={() => setTestingModalOpen(false)}
        open={testingModalOpen}
        variantId={variant?.id ?? null}
      />
      <DislikeFeedbackModal
        open={dislikeTarget !== null}
        onClose={() => setDislikeTarget(null)}
        onSubmit={(comment) => {
          if (!dislikeTarget || !currentEmailId) return;
          feedbackMutation.mutate(
            {
              messageId: dislikeTarget,
              feedback: "DISLIKE",
              comment,
            },
            {
              onSuccess: () =>
                toast({
                  tone: "success",
                  title: "Thanks for your feedback",
                  body: "We'll review it to improve future responses.",
                }),
            },
          );
          setDislikeTarget(null);
        }}
      />
    </main>
  );
}

export default function EmailTemplateProject() {
  return (
    <Suspense fallback={null}>
      <EmailTemplateProjectInner />
    </Suspense>
  );
}
