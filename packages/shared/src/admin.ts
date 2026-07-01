import { z } from "zod";
import { FeedbackSchema } from "./feedback";

export const AdminMetricDeltaSchema = z.object({
  current: z.number().int().nonnegative(),
  previous: z.number().int().nonnegative(),
  changePercent: z.number(),
});

export type AdminMetricDelta = z.infer<typeof AdminMetricDeltaSchema>;

export const AdminRetentionBucketSchema = z.object({
  cohortSize: z.number().int().nonnegative(),
  returned: z.number().int().nonnegative(),
  rate: z.number(),
});

export type AdminRetentionBucket = z.infer<typeof AdminRetentionBucketSchema>;

export const AdminFunnelStepSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  count: z.number().int().nonnegative(),
  rateFromPrevious: z.number(),
  rateFromTotal: z.number(),
});

export type AdminFunnelStep = z.infer<typeof AdminFunnelStepSchema>;

export const AdminTimeseriesPointSchema = z.object({
  date: z.string().min(1),
  signups: z.number().int().nonnegative(),
  loginEvents: z.number().int().nonnegative(),
  emailsCreated: z.number().int().nonnegative(),
  templatesCreated: z.number().int().nonnegative(),
  feedbackSubmitted: z.number().int().nonnegative(),
});

export type AdminTimeseriesPoint = z.infer<typeof AdminTimeseriesPointSchema>;

export const AdminRecentUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable(),
  createdAt: z.string().datetime(),
  lastLoginAt: z.string().datetime().nullable(),
  lastActivityAt: z.string().datetime().nullable(),
  workspaceCount: z.number().int().nonnegative(),
  emailCount: z.number().int().nonnegative(),
  customTemplateCount: z.number().int().nonnegative(),
  feedbackCount: z.number().int().nonnegative(),
  supportTicketCount: z.number().int().nonnegative(),
  providerConnectionCount: z.number().int().nonnegative(),
  loginEventCount: z.number().int().nonnegative(),
  activationScore: z.number().int().min(0).max(100),
  stage: z.string().min(1),
});

export type AdminRecentUser = z.infer<typeof AdminRecentUserSchema>;

export const AdminRecentTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  source: z.enum(["custom", "prebuilt", "community"]),
  workspaceName: z.string().nullable(),
  actorEmail: z.string().email().nullable(),
  actorName: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type AdminRecentTemplate = z.infer<typeof AdminRecentTemplateSchema>;

export const AdminTopTemplateSchema = z.object({
  name: z.string().min(1),
  count: z.number().int().nonnegative(),
});

export type AdminTopTemplate = z.infer<typeof AdminTopTemplateSchema>;

export const AdminInsightSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  detail: z.string().min(1),
  tone: z.enum(["good", "warning", "neutral"]),
});

export type AdminInsight = z.infer<typeof AdminInsightSchema>;

export const AdminDashboardSchema = z.object({
  generatedAt: z.string().datetime(),
  summary: z.object({
    totalUsers: z.number().int().nonnegative(),
    newUsers7d: z.number().int().nonnegative(),
    newUsers30d: z.number().int().nonnegative(),
    loggedInUsers24h: z.number().int().nonnegative(),
    loggedInUsers7d: z.number().int().nonnegative(),
    activeUsers7d: z.number().int().nonnegative(),
    activeUsers30d: z.number().int().nonnegative(),
    returningUsers30d: z.number().int().nonnegative(),
    totalWorkspaces: z.number().int().nonnegative(),
    totalEmails: z.number().int().nonnegative(),
    totalCustomTemplates: z.number().int().nonnegative(),
    totalPrebuiltTemplateUses: z.number().int().nonnegative(),
    totalCommunityTemplates: z.number().int().nonnegative(),
    feedbackTotal: z.number().int().nonnegative(),
    supportOpen: z.number().int().nonnegative(),
    averageFeedbackRating30d: z.number().nullable(),
  }),
  weekOverWeek: z.object({
    signups: AdminMetricDeltaSchema,
    activeUsers: AdminMetricDeltaSchema,
    templatesCreated: AdminMetricDeltaSchema,
    feedbackSubmitted: AdminMetricDeltaSchema,
  }),
  retention: z.object({
    day1: AdminRetentionBucketSchema,
    day7: AdminRetentionBucketSchema,
    day30: AdminRetentionBucketSchema,
  }),
  activationFunnel: z.array(AdminFunnelStepSchema),
  usage: z.object({
    emailsCreated30d: z.number().int().nonnegative(),
    customTemplatesCreated30d: z.number().int().nonnegative(),
    prebuiltTemplatesUsed30d: z.number().int().nonnegative(),
    communityTemplatesShared30d: z.number().int().nonnegative(),
    chatFeedback30d: z.number().int().nonnegative(),
    providerConnectionsTotal: z.number().int().nonnegative(),
    connectedUsersTotal: z.number().int().nonnegative(),
    generationRuns30d: z.number().int().nonnegative(),
    completedGenerationRuns30d: z.number().int().nonnegative(),
    failedGenerationRuns30d: z.number().int().nonnegative(),
    generationFailureRate30d: z.number(),
    averageGenerationLatencyMs30d: z.number().nullable(),
  }),
  timeseries: z.array(AdminTimeseriesPointSchema),
  recentUsers: z.array(AdminRecentUserSchema),
  recentFeedback: z.array(FeedbackSchema),
  recentTemplates: z.array(AdminRecentTemplateSchema),
  topTemplates: z.array(AdminTopTemplateSchema),
  insights: z.array(AdminInsightSchema),
});

export type AdminDashboard = z.infer<typeof AdminDashboardSchema>;

// ---------------------------------------------------------------------------
// Emails browser — list generated emails, render them, read their chat history.
// ---------------------------------------------------------------------------

export const AdminEmailStatusEnum = z.enum([
  "DRAFT",
  "GENERATING",
  "READY",
  "ERROR",
]);
export type AdminEmailStatus = z.infer<typeof AdminEmailStatusEnum>;

export const AdminEmailListItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().nullable(),
  prompt: z.string(),
  status: AdminEmailStatusEnum,
  tone: z.string().nullable(),
  length: z.string().nullable(),
  audience: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  userEmail: z.string().nullable(),
  userName: z.string().nullable(),
  workspaceName: z.string().nullable(),
  variantCount: z.number().int().nonnegative(),
  chatMessageCount: z.number().int().nonnegative(),
  latestSubject: z.string().nullable(),
  previewUrl: z.string().nullable(),
});
export type AdminEmailListItem = z.infer<typeof AdminEmailListItemSchema>;

export const AdminEmailStatusCountSchema = z.object({
  status: AdminEmailStatusEnum,
  count: z.number().int().nonnegative(),
});
export type AdminEmailStatusCount = z.infer<typeof AdminEmailStatusCountSchema>;

export const AdminEmailVolumePointSchema = z.object({
  date: z.string().min(1),
  count: z.number().int().nonnegative(),
});
export type AdminEmailVolumePoint = z.infer<typeof AdminEmailVolumePointSchema>;

export const AdminEmailListSchema = z.object({
  items: z.array(AdminEmailListItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  statusBreakdown: z.array(AdminEmailStatusCountSchema),
  dailyVolume: z.array(AdminEmailVolumePointSchema),
});
export type AdminEmailList = z.infer<typeof AdminEmailListSchema>;

export const AdminEmailVariantSchema = z.object({
  id: z.string().min(1),
  seq: z.number().int(),
  subject: z.string(),
  compiledHtml: z.string(),
  previewUrl: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type AdminEmailVariant = z.infer<typeof AdminEmailVariantSchema>;

export const AdminEmailChatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["USER", "ASSISTANT", "SYSTEM"]),
  kind: z.enum(["TEXT", "THINKING", "STATUS"]),
  content: z.string(),
  imageUrls: z.array(z.string()),
  feedback: z.enum(["LIKE", "DISLIKE"]).nullable(),
  feedbackComment: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type AdminEmailChatMessage = z.infer<
  typeof AdminEmailChatMessageSchema
>;

export const AdminEmailRunSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["INITIAL", "EDIT"]),
  status: z.enum(["STARTED", "STREAMING", "COMPLETED", "FAILED"]),
  inputTokens: z.number().int().nullable(),
  outputTokens: z.number().int().nullable(),
  cachedTokens: z.number().int().nullable(),
  latencyMs: z.number().int().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});
export type AdminEmailRun = z.infer<typeof AdminEmailRunSchema>;

export const AdminEmailDetailSchema = z.object({
  id: z.string().min(1),
  title: z.string().nullable(),
  prompt: z.string(),
  tone: z.string().nullable(),
  length: z.string().nullable(),
  audience: z.string().nullable(),
  status: AdminEmailStatusEnum,
  visibility: z.enum(["PRIVATE", "PUBLIC"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  userEmail: z.string().nullable(),
  userName: z.string().nullable(),
  workspaceName: z.string().nullable(),
  variants: z.array(AdminEmailVariantSchema),
  chatMessages: z.array(AdminEmailChatMessageSchema),
  runs: z.array(AdminEmailRunSchema),
});
export type AdminEmailDetail = z.infer<typeof AdminEmailDetailSchema>;
