import type { TemplateSlug } from "@madoo/shared";

/** UI-only constants: template gallery and prompt presets. */

export type TemplatePreviewKey =
  | "launch"
  | "editorial"
  | "sale"
  | "minimal"
  | "welcome"
  | "event"
  | "digest"
  | "thanks"
  | "feature"
  | "survey"
  | "reengage"
  | "referral";

export type Template = {
  id: string;
  name: string;
  category: string;
  tier: "free" | "premium";
  accent: string;
  bg: string;
  preview: TemplatePreviewKey;
};

export const TEMPLATES: Template[] = [
  { id: "launch-bright", name: "Bright Launch", category: "Launch", tier: "free", accent: "#0E1F1A", bg: "#F2EFE8", preview: "launch" },
  { id: "editorial", name: "The Editorial", category: "Newsletter", tier: "premium", accent: "#1A1A1A", bg: "#FAF7F0", preview: "editorial" },
  { id: "sale-bold", name: "Bold Drop", category: "Promotion", tier: "free", accent: "#FF5C2B", bg: "#FFF1EB", preview: "sale" },
  { id: "minimal-update", name: "Minimal Update", category: "Launch", tier: "free", accent: "#0A0A0A", bg: "#FFFFFF", preview: "minimal" },
  { id: "welcome-soft", name: "Soft Welcome", category: "Onboarding", tier: "premium", accent: "#2C5F4F", bg: "#EFF4F0", preview: "welcome" },
  { id: "event-card", name: "Event Invite", category: "Event", tier: "premium", accent: "#3B2F8C", bg: "#F0EEFA", preview: "event" },
  { id: "digest", name: "Weekly Digest", category: "Newsletter", tier: "free", accent: "#1A1A1A", bg: "#FFFCF5", preview: "digest" },
  { id: "thanks", name: "Thank You Note", category: "Transactional", tier: "free", accent: "#7A3E2D", bg: "#FBF3EC", preview: "thanks" },
  { id: "feature-spot", name: "Feature Spotlight", category: "Launch", tier: "premium", accent: "#0E5C4A", bg: "#EAF3EE", preview: "feature" },
  { id: "survey", name: "Quick Survey", category: "Engagement", tier: "free", accent: "#1A1A1A", bg: "#F5F4F0", preview: "survey" },
  { id: "reengage", name: "Come Back", category: "Engagement", tier: "premium", accent: "#A23E2F", bg: "#FBEEE9", preview: "reengage" },
  { id: "referral", name: "Refer a Friend", category: "Growth", tier: "premium", accent: "#1A4D8A", bg: "#EAF1F8", preview: "referral" },
];

export const CATEGORIES = ["All", "Launch", "Newsletter", "Promotion", "Onboarding", "Event", "Transactional", "Engagement", "Growth"];

export const PROMPT_SUGGESTIONS = [
  "Announce our new pricing plans to existing customers",
  "Welcome new signups with a warm onboarding email",
  "Black Friday sale — 40% off everything, urgency-driven",
  "Re-engage users who haven't logged in for 30 days",
];

export const PROMPT_TONES = ["Friendly", "Professional", "Bold", "Witty", "Urgent"];
export const PROMPT_LENGTHS = ["Short", "Medium", "Long"];
export const PROMPT_AUDIENCES = ["Existing customers", "New signups", "Free users", "Lapsed users", "Internal team"];

/** Maps gallery previews to workspace Template.slug seeds. */
export const TEMPLATE_PREVIEW_SEED_SLUG: Partial<Record<TemplatePreviewKey, TemplateSlug>> = {
  launch: "launch",
  editorial: "newsletter",
  sale: "sale",
  welcome: "welcome",
  minimal: "minimal",
  event: "event",
  digest: "digest",
  thanks: "thanks",
  feature: "feature",
  survey: "survey",
  reengage: "reengage",
  referral: "referral",
};
