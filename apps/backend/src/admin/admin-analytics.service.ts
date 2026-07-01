import { Injectable } from "@nestjs/common";
import {
  AdminDashboardSchema,
  AdminLiveSchema,
  type AdminDashboard,
  type AdminLive,
} from "@madoo/shared";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { toFeedbackDto } from "../feedback/dto/feedback.dto";
import { SEED_TEMPLATE_SLUGS } from "../templates/seed-templates";

const DAY_MS = 86_400_000;
const ACTIVITY_EVENTS = [
  "auth.login",
  "auth.signup",
  "auth.session_active",
  "email.created",
  "template.created_custom",
  "template.used_seed",
  "template.saved_seed",
  "feedback.submitted",
  "support.submitted",
  "provider.connected",
  "community_template.shared",
  "community_template.used",
] as const;

type CountRow = { count: number };
type TopTemplateRow = { name: string; count: number };
type TimeseriesBucket = {
  date: string;
  signups: number;
  loginEvents: number;
  emailsCreated: number;
  templatesCreated: number;
  feedbackSubmitted: number;
};

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Near-real-time presence: distinct users with any activity event in the
   *  last 5 / 15 / 60 minutes, plus the most recently seen users. */
  async live(): Promise<AdminLive> {
    const now = new Date();
    const since = new Date(now.getTime() - 60 * 60 * 1000);

    const events = await this.prisma.productEvent.findMany({
      where: {
        userId: { not: null },
        name: { in: [...ACTIVITY_EVENTS] },
        occurredAt: { gte: since },
      },
      select: { userId: true, occurredAt: true },
      orderBy: { occurredAt: "desc" },
      take: 20_000,
    });

    const latest = new Map<string, Date>();
    for (const event of events) {
      if (event.userId && !latest.has(event.userId)) {
        latest.set(event.userId, event.occurredAt);
      }
    }

    const minutesAgo = (date: Date) =>
      (now.getTime() - date.getTime()) / 60_000;
    const ids = [...latest.keys()];
    const online = ids.filter((id) => minutesAgo(latest.get(id)!) <= 5).length;
    const active15m = ids.filter((id) => minutesAgo(latest.get(id)!) <= 15)
      .length;

    const topIds = ids
      .sort((a, b) => latest.get(b)!.getTime() - latest.get(a)!.getTime())
      .slice(0, 12);
    const users = await this.prisma.user.findMany({
      where: { id: { in: topIds } },
      select: { id: true, email: true, name: true },
    });
    const byId = new Map(users.map((user) => [user.id, user]));
    const recent = topIds
      .filter((id) => byId.has(id))
      .map((id) => {
        const user = byId.get(id)!;
        return {
          id,
          email: user.email,
          name: user.name,
          minutesAgo: Math.round(minutesAgo(latest.get(id)!)),
        };
      });

    return AdminLiveSchema.parse({
      generatedAt: now.toISOString(),
      online,
      active15m,
      active60m: ids.length,
      recent,
    });
  }

  async dashboard(): Promise<AdminDashboard> {
    const now = new Date();
    const today = startOfUtcDay(now);
    const last24h = new Date(now.getTime() - DAY_MS);
    const start7d = addDays(today, -6);
    const start30d = addDays(today, -29);
    const previous7dStart = addDays(start7d, -7);
    const seriesStart = addDays(today, -13);

    const [
      totalUsers,
      totalWorkspaces,
      totalEmails,
      totalCustomTemplates,
      totalPrebuiltTemplateUses,
      totalCommunityTemplates,
      feedbackTotal,
      supportOpen,
      newUsers7d,
      newUsers30d,
      loggedInUsers24h,
      loggedInUsers7d,
      activeUsers7d,
      activeUsers30d,
      returningUsers30d,
      averageFeedbackRating30d,
      usage,
      weekOverWeek,
      retention,
      timeseries,
      recentUsers,
      recentFeedback,
      recentTemplates,
      topTemplates,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.workspace.count(),
      this.prisma.email.count(),
      this.prisma.template.count({
        where: { slug: { notIn: [...SEED_TEMPLATE_SLUGS] } },
      }),
      this.prisma.email.count({ where: { templateSavedAt: { not: null } } }),
      this.prisma.communityTemplate.count(),
      this.prisma.feedback.count(),
      this.prisma.supportTicket.count({ where: { status: "OPEN" } }),
      this.prisma.user.count({ where: { createdAt: { gte: start7d } } }),
      this.prisma.user.count({ where: { createdAt: { gte: start30d } } }),
      this.loggedInUserCountSince(last24h),
      this.loggedInUserCountSince(start7d),
      this.activeUserIdsBetween(start7d).then((ids) => ids.size),
      this.activeUserIdsBetween(start30d).then((ids) => ids.size),
      this.returningUserCountSince(start30d),
      this.averageFeedbackRating(start30d),
      this.usage(start30d),
      this.weekOverWeek(start7d, previous7dStart),
      this.retention(now),
      this.timeseries(seriesStart, today),
      this.recentUsers(),
      this.prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { user: { select: { name: true } } },
      }),
      this.recentTemplates(),
      this.topTemplates(),
    ]);
    const funnel = await this.activationFunnel(totalUsers);

    const dashboard = {
      generatedAt: now.toISOString(),
      summary: {
        totalUsers,
        newUsers7d,
        newUsers30d,
        loggedInUsers24h,
        loggedInUsers7d,
        activeUsers7d,
        activeUsers30d,
        returningUsers30d,
        totalWorkspaces,
        totalEmails,
        totalCustomTemplates,
        totalPrebuiltTemplateUses,
        totalCommunityTemplates,
        feedbackTotal,
        supportOpen,
        averageFeedbackRating30d,
      },
      weekOverWeek,
      retention,
      activationFunnel: funnel,
      usage,
      timeseries,
      recentUsers,
      recentFeedback: recentFeedback.map(toFeedbackDto),
      recentTemplates,
      topTemplates,
      insights: buildInsights({
        totalUsers,
        activatedUsers: funnel.find((step) => step.key === "first_email")
          ?.count ?? 0,
        activeUsers30d,
        returningUsers30d,
        averageFeedbackRating30d,
        generationFailureRate30d: usage.generationFailureRate30d,
        supportOpen,
      }),
    };

    return AdminDashboardSchema.parse(dashboard);
  }

  private async usage(start30d: Date) {
    const [
      emailsCreated30d,
      customTemplatesCreated30d,
      prebuiltTemplatesUsed30d,
      communityTemplatesShared30d,
      chatFeedback30d,
      providerConnectionsTotal,
      connectedUsersTotal,
      generationRuns30d,
      completedGenerationRuns30d,
      failedGenerationRuns30d,
      latency,
    ] = await Promise.all([
      this.prisma.email.count({ where: { createdAt: { gte: start30d } } }),
      this.prisma.template.count({
        where: {
          createdAt: { gte: start30d },
          slug: { notIn: [...SEED_TEMPLATE_SLUGS] },
        },
      }),
      this.prisma.email.count({
        where: { templateSavedAt: { gte: start30d } },
      }),
      this.prisma.communityTemplate.count({
        where: { createdAt: { gte: start30d } },
      }),
      this.prisma.emailChatMessage.count({
        where: { createdAt: { gte: start30d }, feedback: { not: null } },
      }),
      this.prisma.providerConnection.count(),
      this.prisma.providerConnection
        .findMany({ distinct: ["userId"], select: { userId: true } })
        .then((rows) => rows.length),
      this.prisma.emailGenerationRun.count({
        where: { createdAt: { gte: start30d } },
      }),
      this.prisma.emailGenerationRun.count({
        where: { createdAt: { gte: start30d }, status: "COMPLETED" },
      }),
      this.prisma.emailGenerationRun.count({
        where: { createdAt: { gte: start30d }, status: "FAILED" },
      }),
      this.prisma.emailGenerationRun.aggregate({
        where: { createdAt: { gte: start30d }, latencyMs: { not: null } },
        _avg: { latencyMs: true },
      }),
    ]);

    return {
      emailsCreated30d,
      customTemplatesCreated30d,
      prebuiltTemplatesUsed30d,
      communityTemplatesShared30d,
      chatFeedback30d,
      providerConnectionsTotal,
      connectedUsersTotal,
      generationRuns30d,
      completedGenerationRuns30d,
      failedGenerationRuns30d,
      generationFailureRate30d: percent(
        failedGenerationRuns30d,
        generationRuns30d,
      ),
      averageGenerationLatencyMs30d: latency._avg.latencyMs
        ? Math.round(latency._avg.latencyMs)
        : null,
    };
  }

  private async weekOverWeek(start7d: Date, previous7dStart: Date) {
    const previous7dEnd = start7d;
    const [
      signupsCurrent,
      signupsPrevious,
      activeCurrent,
      activePrevious,
      templatesCurrent,
      templatesPrevious,
      feedbackCurrent,
      feedbackPrevious,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: start7d } } }),
      this.prisma.user.count({
        where: { createdAt: { gte: previous7dStart, lt: previous7dEnd } },
      }),
      this.activeUserIdsBetween(start7d).then((ids) => ids.size),
      this.activeUserIdsBetween(previous7dStart, previous7dEnd).then(
        (ids) => ids.size,
      ),
      this.templateActionCountBetween(start7d),
      this.templateActionCountBetween(previous7dStart, previous7dEnd),
      this.prisma.feedback.count({ where: { createdAt: { gte: start7d } } }),
      this.prisma.feedback.count({
        where: { createdAt: { gte: previous7dStart, lt: previous7dEnd } },
      }),
    ]);

    return {
      signups: metricDelta(signupsCurrent, signupsPrevious),
      activeUsers: metricDelta(activeCurrent, activePrevious),
      templatesCreated: metricDelta(templatesCurrent, templatesPrevious),
      feedbackSubmitted: metricDelta(feedbackCurrent, feedbackPrevious),
    };
  }

  private async retention(now: Date) {
    const [day1, day7, day30] = await Promise.all([
      this.retentionBucket(now, 1),
      this.retentionBucket(now, 7),
      this.retentionBucket(now, 30),
    ]);
    return { day1, day7, day30 };
  }

  private async retentionBucket(now: Date, days: number) {
    const cohortStart = new Date(now.getTime() - 90 * DAY_MS);
    const cohortEnd = new Date(now.getTime() - days * DAY_MS);
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: cohortStart, lt: cohortEnd } },
      select: { id: true, createdAt: true, lastLoginAt: true },
      take: 5000,
    });
    if (users.length === 0) {
      return { cohortSize: 0, returned: 0, rate: 0 };
    }

    const events = await this.prisma.productEvent.findMany({
      where: {
        userId: { in: users.map((user) => user.id) },
        name: { in: [...ACTIVITY_EVENTS] },
      },
      select: { userId: true, occurredAt: true },
      take: 20_000,
    });
    const eventsByUser = groupEventDates(events);

    const returned = users.filter((user) => {
      const threshold = new Date(user.createdAt.getTime() + days * DAY_MS);
      if (user.lastLoginAt && user.lastLoginAt >= threshold) return true;
      return (eventsByUser.get(user.id) ?? []).some((date) => date >= threshold);
    }).length;

    return {
      cohortSize: users.length,
      returned,
      rate: percent(returned, users.length),
    };
  }

  private async activationFunnel(totalUsers: number) {
    const [
      everLoggedIn,
      returned,
      firstEmail,
      completedGeneration,
      templateValue,
      feedbackUsers,
      connectedUsers,
    ] = await Promise.all([
      this.usersEverLoggedIn(),
      this.returningUserCountSince(new Date(0)),
      this.countUsersWithAnyEmail(),
      this.countUsersWithCompletedGeneration(),
      this.countUsersWithTemplateValue(),
      this.prisma.feedback
        .findMany({ distinct: ["userId"], select: { userId: true } })
        .then((rows) => rows.length),
      this.prisma.providerConnection
        .findMany({ distinct: ["userId"], select: { userId: true } })
        .then((rows) => rows.length),
    ]);

    const steps = [
      { key: "signed_up", label: "Signed up", count: totalUsers },
      { key: "logged_in", label: "Logged in", count: everLoggedIn },
      { key: "came_back", label: "Came back", count: returned },
      { key: "first_email", label: "Created first email", count: firstEmail },
      {
        key: "completed_generation",
        label: "Got a completed generation",
        count: completedGeneration,
      },
      {
        key: "template_value",
        label: "Saved or created a template",
        count: templateValue,
      },
      { key: "gave_feedback", label: "Sent feedback", count: feedbackUsers },
      {
        key: "connected_provider",
        label: "Connected Gmail/Outlook",
        count: connectedUsers,
      },
    ];

    return steps.map((step, index) => ({
      ...step,
      rateFromPrevious: percent(step.count, steps[index - 1]?.count ?? step.count),
      rateFromTotal: percent(step.count, totalUsers),
    }));
  }

  private async timeseries(seriesStart: Date, today: Date) {
    const buckets = new Map<
      string,
      {
        date: string;
        signups: number;
        loginEvents: number;
        emailsCreated: number;
        templatesCreated: number;
        feedbackSubmitted: number;
      }
    >();
    for (let cursor = seriesStart; cursor <= today; cursor = addDays(cursor, 1)) {
      const key = dateKey(cursor);
      buckets.set(key, {
        date: key,
        signups: 0,
        loginEvents: 0,
        emailsCreated: 0,
        templatesCreated: 0,
        feedbackSubmitted: 0,
      });
    }

    const [users, events, emails, templates, savedTemplates, feedback] =
      await Promise.all([
        this.prisma.user.findMany({
          where: { createdAt: { gte: seriesStart } },
          select: { createdAt: true },
        }),
        this.prisma.productEvent.findMany({
          where: { name: "auth.login", occurredAt: { gte: seriesStart } },
          select: { occurredAt: true },
        }),
        this.prisma.email.findMany({
          where: { createdAt: { gte: seriesStart } },
          select: { createdAt: true },
        }),
        this.prisma.template.findMany({
          where: {
            createdAt: { gte: seriesStart },
            slug: { notIn: [...SEED_TEMPLATE_SLUGS] },
          },
          select: { createdAt: true },
        }),
        this.prisma.email.findMany({
          where: { templateSavedAt: { gte: seriesStart } },
          select: { templateSavedAt: true },
        }),
        this.prisma.feedback.findMany({
          where: { createdAt: { gte: seriesStart } },
          select: { createdAt: true },
        }),
      ]);

    users.forEach((row) => incrementBucket(buckets, row.createdAt, "signups"));
    events.forEach((row) =>
      incrementBucket(buckets, row.occurredAt, "loginEvents"),
    );
    emails.forEach((row) =>
      incrementBucket(buckets, row.createdAt, "emailsCreated"),
    );
    templates.forEach((row) =>
      incrementBucket(buckets, row.createdAt, "templatesCreated"),
    );
    savedTemplates.forEach((row) => {
      if (row.templateSavedAt) {
        incrementBucket(buckets, row.templateSavedAt, "templatesCreated");
      }
    });
    feedback.forEach((row) =>
      incrementBucket(buckets, row.createdAt, "feedbackSubmitted"),
    );

    return [...buckets.values()];
  }

  private async recentUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: [{ lastLoginAt: "desc" }, { createdAt: "desc" }],
      take: 20,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
        memberships: {
          select: {
            workspaceId: true,
            workspace: { select: { templateCreationReason: true } },
          },
        },
        _count: {
          select: {
            feedback: true,
            supportTickets: true,
            providerConnections: true,
            communityTemplates: true,
          },
        },
      },
    });
    const userIds = users.map((user) => user.id);
    const workspaceIds = [
      ...new Set(users.flatMap((user) => user.memberships.map((m) => m.workspaceId))),
    ];

    const [
      emailCounts,
      customTemplateCounts,
      completedRunCounts,
      loginCounts,
      lastEvents,
    ] = await Promise.all([
      this.prisma.email.groupBy({
        by: ["workspaceId"],
        where: { workspaceId: { in: workspaceIds } },
        _count: { _all: true },
      }),
      this.prisma.template.groupBy({
        by: ["workspaceId"],
        where: {
          workspaceId: { in: workspaceIds },
          slug: { notIn: [...SEED_TEMPLATE_SLUGS] },
        },
        _count: { _all: true },
      }),
      this.prisma.emailGenerationRun.groupBy({
        by: ["workspaceId"],
        where: { workspaceId: { in: workspaceIds }, status: "COMPLETED" },
        _count: { _all: true },
      }),
      this.prisma.productEvent.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds }, name: "auth.login" },
        _count: { _all: true },
      }),
      this.prisma.productEvent.groupBy({
        by: ["userId"],
        where: { userId: { in: userIds } },
        _max: { occurredAt: true },
      }),
    ]);

    const emailsByWorkspace = countByWorkspace(emailCounts);
    const templatesByWorkspace = countByWorkspace(customTemplateCounts);
    const completedRunsByWorkspace = countByWorkspace(completedRunCounts);
    const loginsByUser = countByNullableUser(loginCounts);
    const lastEventByUser = maxDateByNullableUser(lastEvents);

    return users.map((user) => {
      const emailCount = sumForWorkspaces(user.memberships, emailsByWorkspace);
      const customTemplateCount = sumForWorkspaces(
        user.memberships,
        templatesByWorkspace,
      );
      const completedRunCount = sumForWorkspaces(
        user.memberships,
        completedRunsByWorkspace,
      );
      const loginEventCount = loginsByUser.get(user.id) ?? 0;
      const feedbackCount = user._count.feedback;
      const supportTicketCount = user._count.supportTickets;
      const providerConnectionCount = user._count.providerConnections;
      const activationScore = scoreActivation({
        loggedIn: Boolean(user.lastLoginAt || loginEventCount),
        statedUseCase: user.memberships.some(
          (m) => !!m.workspace.templateCreationReason,
        ),
        emailCount,
        completedRunCount,
        customTemplateCount,
        providerConnectionCount,
        feedbackCount: feedbackCount + supportTicketCount,
      });
      const lastActivityAt = maxDate([
        user.createdAt,
        user.lastLoginAt,
        lastEventByUser.get(user.id) ?? null,
      ]);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        lastActivityAt: lastActivityAt?.toISOString() ?? null,
        workspaceCount: user.memberships.length,
        emailCount,
        customTemplateCount,
        feedbackCount,
        supportTicketCount,
        providerConnectionCount,
        loginEventCount,
        activationScore,
        stage: userStage({
          loggedIn: Boolean(user.lastLoginAt || loginEventCount),
          emailCount,
          completedRunCount,
          customTemplateCount,
          providerConnectionCount,
          feedbackCount: feedbackCount + supportTicketCount,
        }),
      };
    });
  }

  private async recentTemplates() {
    const [customTemplates, savedTemplates, communityTemplates] =
      await Promise.all([
        this.prisma.template.findMany({
          where: { slug: { notIn: [...SEED_TEMPLATE_SLUGS] } },
          orderBy: { createdAt: "desc" },
          take: 12,
          include: {
            workspace: { select: { name: true } },
            createdBy: { select: { email: true, name: true } },
          },
        }),
        this.prisma.email.findMany({
          where: { templateSavedAt: { not: null } },
          orderBy: { templateSavedAt: "desc" },
          take: 12,
          include: {
            workspace: { select: { name: true } },
            template: { select: { name: true } },
            templateSavedBy: { select: { email: true, name: true } },
            createdBy: { select: { email: true, name: true } },
          },
        }),
        this.prisma.communityTemplate.findMany({
          orderBy: { createdAt: "desc" },
          take: 12,
          include: { author: { select: { email: true, name: true } } },
        }),
      ]);

    return [
      ...customTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        source: "custom" as const,
        workspaceName: template.workspace.name,
        actorEmail: template.createdBy?.email ?? null,
        actorName: template.createdBy?.name ?? null,
        createdAt: template.createdAt.toISOString(),
      })),
      ...savedTemplates.map((email) => ({
        id: email.id,
        name: email.template?.name ?? email.title ?? "Prebuilt template",
        source: "prebuilt" as const,
        workspaceName: email.workspace.name,
        actorEmail:
          email.templateSavedBy?.email ?? email.createdBy?.email ?? null,
        actorName: email.templateSavedBy?.name ?? email.createdBy?.name ?? null,
        createdAt: (email.templateSavedAt ?? email.createdAt).toISOString(),
      })),
      ...communityTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        source: "community" as const,
        workspaceName: null,
        actorEmail: template.author.email,
        actorName: template.author.name,
        createdAt: template.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 12);
  }

  private async topTemplates() {
    const prebuilt = await this.prisma.$queryRaw<TopTemplateRow[]>`
      SELECT t."name" AS name, COUNT(*)::int AS count
      FROM "Email" e
      INNER JOIN "Template" t ON t."id" = e."templateId"
      WHERE e."templateSavedAt" IS NOT NULL
      GROUP BY t."name"
      ORDER BY count DESC, t."name" ASC
      LIMIT 5
    `;
    const community = await this.prisma.communityTemplate.findMany({
      where: { useCount: { gt: 0 } },
      orderBy: [{ useCount: "desc" }, { name: "asc" }],
      take: 5,
      select: { name: true, useCount: true },
    });

    return [
      ...prebuilt,
      ...community.map((row) => ({ name: row.name, count: row.useCount })),
    ]
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 8);
  }

  private async averageFeedbackRating(since: Date): Promise<number | null> {
    const result = await this.prisma.feedback.aggregate({
      where: { createdAt: { gte: since } },
      _avg: { rating: true },
    });
    return result._avg.rating === null
      ? null
      : Math.round(result._avg.rating * 10) / 10;
  }

  private async usersEverLoggedIn(): Promise<number> {
    const ids = new Set<string>();
    const [users, events] = await Promise.all([
      this.prisma.user.findMany({
        where: { lastLoginAt: { not: null } },
        select: { id: true },
      }),
      this.prisma.productEvent.findMany({
        where: {
          userId: { not: null },
          name: { in: ["auth.login", "auth.session_active"] },
        },
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);
    users.forEach((user) => ids.add(user.id));
    events.forEach((event) => {
      if (event.userId) ids.add(event.userId);
    });
    return ids.size;
  }

  private async loggedInUserCountSince(since: Date): Promise<number> {
    const ids = new Set<string>();
    const [users, events] = await Promise.all([
      this.prisma.user.findMany({
        where: { lastLoginAt: { gte: since } },
        select: { id: true },
      }),
      this.prisma.productEvent.findMany({
        where: {
          userId: { not: null },
          name: { in: ["auth.login", "auth.session_active"] },
          occurredAt: { gte: since },
        },
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);
    users.forEach((user) => ids.add(user.id));
    events.forEach((event) => {
      if (event.userId) ids.add(event.userId);
    });
    return ids.size;
  }

  private async activeUserIdsBetween(start: Date, end?: Date) {
    const range = end ? { gte: start, lt: end } : { gte: start };
    const ids = new Set<string>();
    const [
      users,
      events,
      emails,
      templates,
      feedback,
      support,
      connections,
      communityTemplates,
    ] = await Promise.all([
      this.prisma.user.findMany({
        where: { lastLoginAt: range },
        select: { id: true },
      }),
      this.prisma.productEvent.findMany({
        where: {
          userId: { not: null },
          name: { in: [...ACTIVITY_EVENTS] },
          occurredAt: range,
        },
        distinct: ["userId"],
        select: { userId: true },
      }),
      this.prisma.email.findMany({
        where: { createdByUserId: { not: null }, createdAt: range },
        distinct: ["createdByUserId"],
        select: { createdByUserId: true },
      }),
      this.prisma.template.findMany({
        where: {
          createdByUserId: { not: null },
          createdAt: range,
          slug: { notIn: [...SEED_TEMPLATE_SLUGS] },
        },
        distinct: ["createdByUserId"],
        select: { createdByUserId: true },
      }),
      this.prisma.feedback.findMany({
        where: { createdAt: range },
        distinct: ["userId"],
        select: { userId: true },
      }),
      this.prisma.supportTicket.findMany({
        where: { createdAt: range },
        distinct: ["userId"],
        select: { userId: true },
      }),
      this.prisma.providerConnection.findMany({
        where: { updatedAt: range },
        distinct: ["userId"],
        select: { userId: true },
      }),
      this.prisma.communityTemplate.findMany({
        where: { createdAt: range },
        distinct: ["authorUserId"],
        select: { authorUserId: true },
      }),
    ]);

    users.forEach((row) => ids.add(row.id));
    events.forEach((row) => row.userId && ids.add(row.userId));
    emails.forEach((row) => row.createdByUserId && ids.add(row.createdByUserId));
    templates.forEach(
      (row) => row.createdByUserId && ids.add(row.createdByUserId),
    );
    feedback.forEach((row) => ids.add(row.userId));
    support.forEach((row) => ids.add(row.userId));
    connections.forEach((row) => ids.add(row.userId));
    communityTemplates.forEach((row) => ids.add(row.authorUserId));
    return ids;
  }

  private async returningUserCountSince(since: Date): Promise<number> {
    const users = await this.prisma.user.findMany({
      where: { lastLoginAt: { gte: since } },
      select: { id: true, createdAt: true, lastLoginAt: true },
    });
    const events = await this.prisma.productEvent.findMany({
      where: {
        userId: { not: null },
        name: { in: [...ACTIVITY_EVENTS] },
        occurredAt: { gte: since },
      },
      select: { userId: true, occurredAt: true },
      take: 20_000,
    });
    const daysByUser = new Map<string, Set<string>>();
    events.forEach((event) => {
      if (!event.userId) return;
      const days = daysByUser.get(event.userId) ?? new Set<string>();
      days.add(dateKey(event.occurredAt));
      daysByUser.set(event.userId, days);
    });

    const returning = new Set<string>();
    users.forEach((user) => {
      if (
        user.lastLoginAt &&
        user.lastLoginAt.getTime() - user.createdAt.getTime() >= DAY_MS
      ) {
        returning.add(user.id);
      }
    });
    daysByUser.forEach((days, userId) => {
      if (days.size >= 2) returning.add(userId);
    });
    return returning.size;
  }

  private async countUsersWithAnyEmail(): Promise<number> {
    return scalarCount(await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT COALESCE(e."createdByUserId", m."userId"))::int AS count
      FROM "Email" e
      LEFT JOIN "Membership" m ON m."workspaceId" = e."workspaceId"
      WHERE e."createdByUserId" IS NOT NULL OR m."userId" IS NOT NULL
    `);
  }

  private async countUsersWithCompletedGeneration(): Promise<number> {
    return scalarCount(await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT COALESCE(e."createdByUserId", m."userId"))::int AS count
      FROM "EmailGenerationRun" r
      INNER JOIN "Email" e ON e."id" = r."emailId"
      LEFT JOIN "Membership" m ON m."workspaceId" = e."workspaceId"
      WHERE r."status" = 'COMPLETED'
        AND (e."createdByUserId" IS NOT NULL OR m."userId" IS NOT NULL)
    `);
  }

  private async countUsersWithTemplateValue(): Promise<number> {
    return scalarCount(await this.prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(DISTINCT user_id)::int AS count
      FROM (
        SELECT COALESCE(t."createdByUserId", m."userId") AS user_id
        FROM "Template" t
        LEFT JOIN "Membership" m ON m."workspaceId" = t."workspaceId"
        WHERE t."slug" NOT IN (${Prisma.join([...SEED_TEMPLATE_SLUGS])})
        UNION
        SELECT COALESCE(e."templateSavedByUserId", e."createdByUserId", m."userId") AS user_id
        FROM "Email" e
        LEFT JOIN "Membership" m ON m."workspaceId" = e."workspaceId"
        WHERE e."templateSavedAt" IS NOT NULL
      ) value_users
      WHERE user_id IS NOT NULL
    `);
  }

  private async templateActionCountBetween(start: Date, end?: Date) {
    const range = end ? { gte: start, lt: end } : { gte: start };
    const [custom, prebuilt] = await Promise.all([
      this.prisma.template.count({
        where: { createdAt: range, slug: { notIn: [...SEED_TEMPLATE_SLUGS] } },
      }),
      this.prisma.email.count({ where: { templateSavedAt: range } }),
    ]);
    return custom + prebuilt;
  }
}

function startOfUtcDay(value: Date): Date {
  const copy = new Date(value);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS);
}

function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function percent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

function metricDelta(current: number, previous: number) {
  return {
    current,
    previous,
    changePercent:
      previous === 0
        ? current === 0
          ? 0
          : 100
        : Math.round(((current - previous) / previous) * 1000) / 10,
  };
}

function scalarCount(rows: CountRow[]): number {
  return Number(rows[0]?.count ?? 0);
}

function incrementBucket(
  buckets: Map<string, TimeseriesBucket>,
  date: Date,
  field:
    | "signups"
    | "loginEvents"
    | "emailsCreated"
    | "templatesCreated"
    | "feedbackSubmitted",
) {
  const bucket = buckets.get(dateKey(date));
  if (!bucket) return;
  bucket[field] += 1;
}

function groupEventDates(
  events: Array<{ userId: string | null; occurredAt: Date }>,
): Map<string, Date[]> {
  const grouped = new Map<string, Date[]>();
  events.forEach((event) => {
    if (!event.userId) return;
    const dates = grouped.get(event.userId) ?? [];
    dates.push(event.occurredAt);
    grouped.set(event.userId, dates);
  });
  return grouped;
}

function countByWorkspace(
  rows: Array<{ workspaceId: string; _count: { _all: number } }>,
): Map<string, number> {
  return new Map(rows.map((row) => [row.workspaceId, row._count._all]));
}

function countByNullableUser(
  rows: Array<{ userId: string | null; _count: { _all: number } }>,
): Map<string, number> {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    if (row.userId) map.set(row.userId, row._count._all);
  });
  return map;
}

function maxDateByNullableUser(
  rows: Array<{ userId: string | null; _max: { occurredAt: Date | null } }>,
): Map<string, Date> {
  const map = new Map<string, Date>();
  rows.forEach((row) => {
    if (row.userId && row._max.occurredAt) {
      map.set(row.userId, row._max.occurredAt);
    }
  });
  return map;
}

function sumForWorkspaces(
  memberships: Array<{ workspaceId: string }>,
  counts: Map<string, number>,
): number {
  return memberships.reduce(
    (total, membership) => total + (counts.get(membership.workspaceId) ?? 0),
    0,
  );
}

function maxDate(values: Array<Date | null>): Date | null {
  return values.reduce<Date | null>((max, value) => {
    if (!value) return max;
    if (!max || value > max) return value;
    return max;
  }, null);
}

function scoreActivation(input: {
  loggedIn: boolean;
  statedUseCase: boolean;
  emailCount: number;
  completedRunCount: number;
  customTemplateCount: number;
  providerConnectionCount: number;
  feedbackCount: number;
}): number {
  let score = 0;
  if (input.loggedIn) score += 15;
  if (input.statedUseCase) score += 10;
  if (input.emailCount > 0) score += 20;
  if (input.completedRunCount > 0) score += 20;
  if (input.customTemplateCount > 0) score += 15;
  if (input.providerConnectionCount > 0) score += 10;
  if (input.feedbackCount > 0) score += 10;
  return Math.min(score, 100);
}

function userStage(input: {
  loggedIn: boolean;
  emailCount: number;
  completedRunCount: number;
  customTemplateCount: number;
  providerConnectionCount: number;
  feedbackCount: number;
}): string {
  if (!input.loggedIn) return "Signed up";
  if (input.emailCount === 0) return "Exploring";
  if (input.completedRunCount === 0) return "Draft started";
  if (input.providerConnectionCount > 0) return "Export-ready";
  if (input.feedbackCount > 0) return "Talking to us";
  if (input.customTemplateCount > 0) return "Saved templates";
  return "Generating";
}

function buildInsights(input: {
  totalUsers: number;
  activatedUsers: number;
  activeUsers30d: number;
  returningUsers30d: number;
  averageFeedbackRating30d: number | null;
  generationFailureRate30d: number;
  supportOpen: number;
}) {
  const activationRate = percent(input.activatedUsers, input.totalUsers);
  const returnRate = percent(input.returningUsers30d, input.activeUsers30d);
  const feedback =
    input.averageFeedbackRating30d === null
      ? "No rating yet"
      : `${input.averageFeedbackRating30d.toFixed(1)}/5`;

  return [
    {
      label: "Activation",
      value: `${activationRate}%`,
      detail: `${input.activatedUsers} of ${input.totalUsers} users created at least one email.`,
      tone: activationRate >= 40 ? "good" : activationRate >= 15 ? "neutral" : "warning",
    },
    {
      label: "Comeback",
      value: `${returnRate}%`,
      detail: `${input.returningUsers30d} users came back after first contact in the last 30 days.`,
      tone: returnRate >= 35 ? "good" : returnRate >= 10 ? "neutral" : "warning",
    },
    {
      label: "Quality",
      value: feedback,
      detail:
        input.averageFeedbackRating30d === null
          ? "Waiting for first in-app feedback rating."
          : "Average in-app feedback rating over the last 30 days.",
      tone:
        input.averageFeedbackRating30d === null
          ? "neutral"
          : input.averageFeedbackRating30d >= 4
            ? "good"
            : input.averageFeedbackRating30d >= 3
              ? "neutral"
              : "warning",
    },
    {
      label: "Generation health",
      value: `${input.generationFailureRate30d}%`,
      detail: "Failed AI generation runs over the last 30 days.",
      tone:
        input.generationFailureRate30d <= 5
          ? "good"
          : input.generationFailureRate30d <= 15
            ? "neutral"
            : "warning",
    },
    {
      label: "Support queue",
      value: String(input.supportOpen),
      detail: "Open support tickets waiting for a response.",
      tone: input.supportOpen === 0 ? "good" : "warning",
    },
  ];
}
