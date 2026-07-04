import {
  EmailChatToolCallPayloadSchema,
  type EmailChatMessageDto,
  type EmailDto,
} from "@madoo/shared";
import type { AiMessageFeedback, ChatMessage, ToolCallView } from "./types";

export function createTimelineMessage(
  emailId: string,
  firstLabel: string,
): ChatMessage {
  const now = Date.now();
  return {
    id: `timeline-${now}-${Math.random().toString(36).slice(2, 7)}`,
    role: "timeline",
    content: "",
    seq: now,
    emailId,
    startedAt: now,
    steps: [{ id: `step-${now}`, label: firstLabel, state: "active" }],
  };
}

/** Append a step to a timeline, marking earlier steps done. Skips repeats. */
export function appendTimelineStep(
  list: ChatMessage[],
  timelineId: string,
  label: string,
): ChatMessage[] {
  return list.map((message) => {
    if (message.id !== timelineId || message.role !== "timeline") return message;
    const steps = message.steps ?? [];
    if (steps.length && steps[steps.length - 1].label === label) return message;
    return {
      ...message,
      finishedAt: undefined,
      steps: [
        ...steps.map((step) => ({ ...step, state: "done" as const })),
        { id: `step-${Date.now()}-${steps.length}`, label, state: "active" },
      ],
    };
  });
}

/** Mark a timeline finished; its steps stay in the conversation as a record. */
export function finishTimeline(
  list: ChatMessage[],
  timelineId: string,
): ChatMessage[] {
  return list.map((message) => {
    if (message.id !== timelineId || message.role !== "timeline") return message;
    return {
      ...message,
      finishedAt: Date.now(),
      steps: (message.steps ?? []).map((step) => ({
        ...step,
        state: "done" as const,
      })),
    };
  });
}

export function latestVariant(email: EmailDto | null | undefined) {
  return email?.variants[email.variants.length - 1] ?? null;
}

function orderChatRows(chat: EmailChatMessageDto[] | undefined) {
  return [...(chat ?? [])].sort((a, b) => {
    const timeDelta = Date.parse(a.createdAt) - Date.parse(b.createdAt);
    if (timeDelta !== 0) return timeDelta;
    return a.id.localeCompare(b.id);
  });
}

export function applyAiMessageFeedback(
  list: ChatMessage[],
  messageId: string,
  feedback: AiMessageFeedback | null,
): ChatMessage[] {
  return list.map((message) => {
    if (message.role !== "assistant") return message;
    if (message.id === messageId) return { ...message, feedback };

    const versions = message.versions;
    if (!versions?.some((version) => version.id === messageId)) {
      return message;
    }

    const nextVersions = versions.map((version) =>
      version.id === messageId ? { ...version, feedback } : version,
    );
    const selectedVersion = nextVersions[message.versionIndex ?? 0];
    return {
      ...message,
      versions: nextVersions,
      feedback:
        selectedVersion?.id === messageId ? feedback : message.feedback,
    };
  });
}

export function mapChatMessages(
  chat: EmailChatMessageDto[] | undefined,
  email: EmailDto | null | undefined,
  selectedVersions: Record<string, number> = {},
): ChatMessage[] {
  const orderedChat = orderChatRows(chat);

  // Pair each assistant THINKING row with the answer that immediately follows
  // it (same turn), so the reasoning can hang off its response message.
  const thinkingByText = new Map<string, string>();
  let pendingThinking: string | null = null;
  for (const row of orderedChat) {
    if (row.role === "ASSISTANT" && row.kind === "THINKING") {
      pendingThinking = row.content;
    } else if (row.role === "ASSISTANT" && row.kind === "TEXT") {
      if (pendingThinking) thinkingByText.set(row.id, pendingThinking);
      pendingThinking = null;
    } else {
      pendingThinking = null;
    }
  }

  const toolCallsByText = new Map<string, ToolCallView[]>();
  let pendingToolCalls: ToolCallView[] = [];
  for (const row of orderedChat) {
    if (row.role === "ASSISTANT" && row.kind === "TOOL_CALL") {
      try {
        const parsed = EmailChatToolCallPayloadSchema.safeParse(
          JSON.parse(row.content),
        );
        if (!parsed.success) continue;
        pendingToolCalls.push({
          ...parsed.data,
          status: "done",
        });
      } catch {
        continue;
      }
    } else if (row.role === "ASSISTANT" && row.kind === "TEXT") {
      if (pendingToolCalls.length) {
        toolCallsByText.set(row.id, pendingToolCalls);
      }
      pendingToolCalls = [];
    } else if (row.role === "USER") {
      pendingToolCalls = [];
    }
  }

  const rows =
    orderedChat.filter(
      (message) => message.kind !== "THINKING" && message.kind !== "TOOL_CALL",
    );

  // Collect assistant response-version siblings, oldest → newest (chat is asc).
  const groups = new Map<string, EmailChatMessageDto[]>();
  for (const row of rows) {
    if (row.role === "ASSISTANT" && row.groupId) {
      const siblings = groups.get(row.groupId) ?? [];
      siblings.push(row);
      groups.set(row.groupId, siblings);
    }
  }

  const emittedGroups = new Set<string>();
  const visibleChat: ChatMessage[] = [];
  for (const message of rows) {
    if (message.role === "ASSISTANT" && message.groupId) {
      // Emit a grouped response once, at the position of its first sibling.
      if (emittedGroups.has(message.groupId)) continue;
      emittedGroups.add(message.groupId);
      const siblings = groups.get(message.groupId) ?? [message];
      const lastIndex = siblings.length - 1;
      const selected = Math.min(
        Math.max(selectedVersions[message.groupId] ?? lastIndex, 0),
        lastIndex,
      );
      visibleChat.push({
        id: `group-${message.groupId}`,
        role: "assistant",
        content: siblings[selected].content,
        // Anchor the position to the first sibling so switching versions never
        // reorders the message.
        seq: Date.parse(siblings[0].createdAt) || 0,
        emailId: email?.id,
        groupId: message.groupId,
        versions: siblings.map((sibling) => ({
          id: sibling.id,
          content: sibling.content,
          feedback: sibling.feedback ?? null,
        })),
        versionIndex: selected,
        thinking: thinkingByText.get(siblings[selected].id),
        feedback: siblings[selected].feedback ?? null,
        toolCalls: toolCallsByText.get(siblings[selected].id),
      });
      continue;
    }
    visibleChat.push({
      id: message.id,
      role: (message.role === "USER"
        ? "user"
        : message.kind === "STATUS"
          ? "status"
          : "assistant") as ChatMessage["role"],
      content: message.content,
      seq: Date.parse(message.createdAt) || 0,
      emailId: email?.id,
      images:
        message.role === "USER" && message.imageUrls.length > 0
          ? message.imageUrls
          : undefined,
      thinking:
        message.role === "ASSISTANT"
          ? thinkingByText.get(message.id)
          : undefined,
      feedback:
        message.role === "ASSISTANT" ? (message.feedback ?? null) : undefined,
      toolCalls:
        message.role === "ASSISTANT"
          ? toolCallsByText.get(message.id)
          : undefined,
    });
  }

  // Always lead with the user's brief, even before the chat rows have loaded.
  const messages: ChatMessage[] =
    email && !visibleChat.some((message) => message.role === "user")
      ? [
        {
          id: `${email.id}-prompt`,
          role: "user",
          content: email.prompt,
          seq: Date.parse(email.createdAt) || 0,
          emailId: email.id,
        },
        ...visibleChat,
      ]
      : visibleChat;

  // While generating (e.g. after a reload, with no live SSE), keep a visible
  // progress line until the assistant reply lands instead of a lone bubble.
  if (
    email?.status === "GENERATING" &&
    !messages.some(
      (message) =>
        message.role === "assistant" ||
        message.role === "status" ||
        message.role === "timeline",
    )
  ) {
    messages.push({
      id: `${email.id}-generating`,
      role: "status",
      content: "Generating your email…",
      seq: Date.now(),
      emailId: email.id,
    });
  }

  return messages;
}

export function deriveConversationTitle(
  messages: ChatMessage[],
  fallback: string,
): string {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const title = firstUserMessage?.content.replace(/\s+/g, " ").trim();
  if (!title) return fallback;
  return title.length > 48 ? `${title.slice(0, 45).trimEnd()}...` : title;
}

export function upsertMessage(list: ChatMessage[], next: ChatMessage) {
  const index = list.findIndex((message) => message.id === next.id);
  if (index === -1) return [...list, next];
  const copy = [...list];
  copy[index] = next;
  return copy;
}
