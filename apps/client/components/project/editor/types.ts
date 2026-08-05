import type { IconSvgElement } from "@hugeicons/react";

export type TimelineStep = {
  id: string;
  label: string;
  state: "active" | "done";
};

export type ToolCallView = {
  id: string;
  /** Raw tool name from the backend, e.g. "find_images". */
  name: string;
  /** Human title, e.g. "Searching images". */
  title: string;
  status: "running" | "done";
  /** Primary argument shown inline, e.g. the query or URL. */
  detail?: string;
  /** One-line result summary, e.g. "Found 6 images". */
  summary?: string;
  /** Preview image URLs (find_images). */
  images?: string[];
};

/** An ordered segment of an assistant turn: a run of text or a tool call. */
export type MessagePart =
  | { kind: "text"; id: string; text: string }
  | { kind: "tool"; call: ToolCallView };

export type AiMessageFeedback = "LIKE" | "DISLIKE";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "status" | "error" | "timeline";
  content: string;
  /** Chronological sort key so server rows and client-only rows interleave. */
  seq?: number;
  /** Owning email, used to drop client-only rows when switching projects. */
  emailId?: string;
  /** Object URLs for images attached to a user message (display only). */
  images?: string[];
  /** Label of the preview element the user had selected for this edit turn. */
  selectedElementLabel?: string | null;
  /** Design skill ids attached to this turn from the composer picker. */
  skills?: string[];
  /** Assistant response-version group (regenerations of the same turn). */
  groupId?: string;
  /** All sibling responses in the group, oldest → newest. */
  versions?: {
    id: string;
    content: string;
    feedback?: AiMessageFeedback | null;
  }[];
  /** Index of the currently shown sibling within `versions`. */
  versionIndex?: number;
  /** Model reasoning shown in a collapsible block above the answer. */
  thinking?: string;
  feedback?: AiMessageFeedback | null;
  /** How long the reasoning took (live only); drives "Thought for Ns". */
  thinkingSeconds?: number;
  /** True while reasoning is still streaming; drives the live label. */
  thinkingActive?: boolean;
  steps?: TimelineStep[];
  /** Tool calls made during this turn, shown at the bottom of the message. */
  toolCalls?: ToolCallView[];
  /** Ordered text/tool segments for live turns (interleaved rendering). */
  parts?: MessagePart[];
  /** True while this turn is still streaming (hides actions, shows loader). */
  generating?: boolean;
  /** True once the email component code has started streaming. */
  buildingEmail?: boolean;
  startedAt?: number;
  finishedAt?: number;
};

export type PreviewMode = "desktop" | "responsive";
export type TemplateTheme = "light" | "dark";

export type ExportProvider = {
  name: string;
  iconSrc: string;
  badge?: string;
};

export type ExportFileFormat = {
  name: string;
  description: string;
  icon: IconSvgElement;
};

export type ExportTab = "email" | "application" | "file";
