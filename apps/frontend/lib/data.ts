import type { TemplateSlug } from "@madoo/shared";

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
  { id: "launch-bright", name: "Bright Launch", category: "Product Launch", tier: "free", accent: "#0E1F1A", bg: "#F2EFE8", preview: "launch" },
  { id: "editorial", name: "The Editorial", category: "Newsletter", tier: "premium", accent: "#1A1A1A", bg: "#FAF7F0", preview: "editorial" },
  { id: "sale-bold", name: "Bold Drop", category: "Promotion", tier: "free", accent: "#FF5C2B", bg: "#FFF1EB", preview: "sale" },
  { id: "minimal-update", name: "Minimal Update", category: "Changelog", tier: "free", accent: "#0A0A0A", bg: "#FFFFFF", preview: "minimal" },
  { id: "welcome-soft", name: "Soft Welcome", category: "Onboarding", tier: "premium", accent: "#2C5F4F", bg: "#EFF4F0", preview: "welcome" },
  { id: "event-card", name: "Event Invite", category: "Event", tier: "premium", accent: "#3B2F8C", bg: "#F0EEFA", preview: "event" },
  { id: "digest", name: "Weekly Digest", category: "Newsletter", tier: "free", accent: "#1A1A1A", bg: "#FFFCF5", preview: "digest" },
  { id: "thanks", name: "Thank You Note", category: "Transactional", tier: "free", accent: "#7A3E2D", bg: "#FBF3EC", preview: "thanks" },
  { id: "feature-spot", name: "Feature Spotlight", category: "Product", tier: "premium", accent: "#0E5C4A", bg: "#EAF3EE", preview: "feature" },
  { id: "survey", name: "Quick Survey", category: "Engagement", tier: "free", accent: "#1A1A1A", bg: "#F5F4F0", preview: "survey" },
  { id: "reengage", name: "Come Back", category: "Re-engagement", tier: "premium", accent: "#A23E2F", bg: "#FBEEE9", preview: "reengage" },
  { id: "referral", name: "Refer a Friend", category: "Growth", tier: "premium", accent: "#1A4D8A", bg: "#EAF1F8", preview: "referral" },
];

export const CATEGORIES = ["All", "Product Launch", "Newsletter", "Promotion", "Onboarding", "Event", "Transactional"];

export const PROMPT_SUGGESTIONS = [
  "Announce our new pricing plans to existing customers",
  "Welcome new signups with a warm onboarding email",
  "Black Friday sale — 40% off everything, urgency-driven",
  "Re-engage users who haven't logged in for 30 days",
];

export type Contact = {
  id: number;
  name: string;
  email: string;
  tags: string[];
  joined: string;
  status: "active" | "unsubscribed" | "bounced";
  opens: number;
};

export const MOCK_CONTACTS: Contact[] = [
  { id: 1, name: "Sofia Martinez", email: "sofia@acme.co", tags: ["customer", "pro"], joined: "Apr 12", status: "active", opens: 24 },
  { id: 2, name: "James Liu", email: "james@startup.io", tags: ["lead"], joined: "Apr 14", status: "active", opens: 8 },
  { id: 3, name: "Priya Shah", email: "priya@design.studio", tags: ["customer"], joined: "Apr 02", status: "active", opens: 41 },
  { id: 4, name: "Marco Rossi", email: "marco@trattoria.it", tags: ["customer", "lapsed"], joined: "Mar 18", status: "unsubscribed", opens: 3 },
  { id: 5, name: "Aisha Khan", email: "aisha@fintech.co", tags: ["lead", "enterprise"], joined: "Apr 20", status: "active", opens: 12 },
  { id: 6, name: "David Park", email: "d.park@consulting.com", tags: ["customer"], joined: "Feb 09", status: "active", opens: 67 },
  { id: 7, name: "Lena Becker", email: "lena@studio.de", tags: ["lead"], joined: "Apr 18", status: "active", opens: 5 },
  { id: 8, name: "Tom Reilly", email: "tom@agency.co", tags: ["customer", "pro"], joined: "Jan 27", status: "bounced", opens: 0 },
];

export type Segment = { name: string; count: number; accent: string };

export const SEGMENTS: Segment[] = [
  { name: "All contacts", count: 2847, accent: "#1F1A12" },
  { name: "Pro customers", count: 412, accent: "#2F5C42" },
  { name: "Free users", count: 1893, accent: "#A87E54" },
  { name: "Lapsed (30d+)", count: 184, accent: "#A23E2F" },
  { name: "New this week", count: 67, accent: "#5B5FCB" },
];

export type CampaignStatus = "sent" | "sending" | "scheduled" | "draft";

export type Campaign = {
  id: number;
  name: string;
  subject: string;
  status: CampaignStatus;
  sentAt: string;
  recipients: number;
  opens: number;
  clicks: number;
  audience: string;
};

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 1, name: "Spring launch announcement", subject: "Something new is shipping today.", status: "sent", sentAt: "Apr 18, 10:00 AM", recipients: 2847, opens: 1681, clicks: 412, audience: "All contacts" },
  { id: 2, name: "Welcome series — day 1", subject: "Welcome — here's where to start.", status: "sending", sentAt: "Sending now", recipients: 67, opens: 12, clicks: 4, audience: "New this week" },
  { id: 3, name: "Re-engagement push", subject: "It's been a minute.", status: "scheduled", sentAt: "Apr 26, 9:00 AM", recipients: 184, opens: 0, clicks: 0, audience: "Lapsed (30d+)" },
  { id: 4, name: "Pricing update notice", subject: "A small change to our pricing.", status: "draft", sentAt: "—", recipients: 412, opens: 0, clicks: 0, audience: "Pro customers" },
  { id: 5, name: "February newsletter", subject: "The Weekly · Vol. 9", status: "sent", sentAt: "Feb 28, 9:00 AM", recipients: 2641, opens: 1320, clicks: 287, audience: "All contacts" },
];

export const DRAFT_EMAILS = [
  { id: "d1", name: "Spring launch announcement", subject: "Something new is shipping today.", tplIdx: 0, updated: "2 hours ago" },
  { id: "d2", name: "Pricing update notice", subject: "A small change to our pricing.", tplIdx: 3, updated: "Yesterday" },
  { id: "d3", name: "Welcome series — day 1", subject: "Welcome — here's where to start.", tplIdx: 4, updated: "3 days ago" },
  { id: "d4", name: "February newsletter", subject: "The Weekly · Vol. 9", tplIdx: 6, updated: "1 week ago" },
];

export type EmailVariable = {
  token: string;
  auto: string | null;
  confidence: "high" | "medium" | "low";
  missing: number;
  suggestions?: string[];
};

export const EMAIL_VARIABLES: EmailVariable[] = [
  { token: "{Nombre}", auto: "first_name", confidence: "high", missing: 0 },
  { token: "{Empresa}", auto: "company", confidence: "high", missing: 12 },
  { token: "{Ciudad}", auto: null, confidence: "low", missing: 46, suggestions: ["city", "location", "country"] },
  { token: "{Última_compra}", auto: "last_order_date", confidence: "medium", missing: 8 },
];

export const CSV_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "company",
  "city",
  "location",
  "country",
  "last_order_date",
  "plan",
  "signup_date",
];

export const PREVIEW_CONTACTS = [
  { name: "Sofia Martinez", data: { "{Nombre}": "Sofia", "{Empresa}": "Acme Co", "{Ciudad}": "Madrid", "{Última_compra}": "Apr 12" } },
  { name: "James Liu", data: { "{Nombre}": "James", "{Empresa}": "Startup.io", "{Ciudad}": "—", "{Última_compra}": "Apr 14" } },
  { name: "Priya Shah", data: { "{Nombre}": "Priya", "{Empresa}": "Design Studio", "{Ciudad}": "Mumbai", "{Última_compra}": "Apr 02" } },
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
