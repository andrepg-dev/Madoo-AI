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
