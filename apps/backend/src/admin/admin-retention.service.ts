import { Injectable } from "@nestjs/common";
import {
  AdminRetentionOverviewSchema,
  type AdminRetentionOverview,
  type AdminRetentionBucket,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";

const DAY_MS = 86_400_000;

// Same activity signals the dashboard uses to decide a user "did something".
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

type Enriched = {
  id: string;
  email: string;
  name: string | null;
  firstSeen: Date;
  lastSeen: Date;
  activeDays: number;
  returnVisits: number;
};

@Injectable()
export class AdminRetentionService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<AdminRetentionOverview> {
    const now = new Date();

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
      },
      orderBy: { createdAt: "asc" },
      take: 5000,
    });
    const userIds = users.map((user) => user.id);

    const events = userIds.length
      ? await this.prisma.productEvent.findMany({
          where: {
            userId: { in: userIds },
            name: { in: [...ACTIVITY_EVENTS] },
          },
          select: { userId: true, occurredAt: true },
          take: 100_000,
        })
      : [];

    // Distinct active day-keys per user (signup day + login day + every event day).
    const daysByUser = new Map<string, Set<string>>();
    const lastEventAt = new Map<string, Date>();
    for (const user of users) {
      const set = new Set<string>();
      set.add(dateKey(user.createdAt));
      if (user.lastLoginAt) set.add(dateKey(user.lastLoginAt));
      daysByUser.set(user.id, set);
    }
    for (const event of events) {
      if (!event.userId) continue;
      daysByUser.get(event.userId)?.add(dateKey(event.occurredAt));
      const current = lastEventAt.get(event.userId);
      if (!current || event.occurredAt > current) {
        lastEventAt.set(event.userId, event.occurredAt);
      }
    }

    const enriched: Enriched[] = users.map((user) => {
      const days = daysByUser.get(user.id) ?? new Set<string>();
      const activeDays = days.size;
      const times = [user.createdAt.getTime()];
      if (user.lastLoginAt) times.push(user.lastLoginAt.getTime());
      const lastEvent = lastEventAt.get(user.id);
      if (lastEvent) times.push(lastEvent.getTime());
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        firstSeen: user.createdAt,
        lastSeen: new Date(Math.max(...times)),
        activeDays,
        returnVisits: Math.max(0, activeDays - 1),
      };
    });

    const totalUsers = enriched.length;
    const returningUsers = enriched.filter((u) => u.returnVisits >= 1).length;
    const oneTimeUsers = totalUsers - returningUsers;
    const activeLast7d = enriched.filter(
      (u) => now.getTime() - u.lastSeen.getTime() <= 7 * DAY_MS,
    ).length;
    const activeLast30d = enriched.filter(
      (u) => now.getTime() - u.lastSeen.getTime() <= 30 * DAY_MS,
    ).length;
    const avgActiveDays =
      totalUsers === 0
        ? 0
        : enriched.reduce((sum, u) => sum + u.activeDays, 0) / totalUsers;

    const returnsDistribution = [
      { label: "Never returned", match: (n: number) => n === 0 },
      { label: "1 return", match: (n: number) => n === 1 },
      { label: "2 returns", match: (n: number) => n === 2 },
      { label: "3 returns", match: (n: number) => n === 3 },
      { label: "4+ returns", match: (n: number) => n >= 4 },
    ].map((bucket) => ({
      label: bucket.label,
      count: enriched.filter((u) => bucket.match(u.returnVisits)).length,
    }));

    // Daily active / returning users over the last 30 days.
    const firstDayByUser = new Map<string, string>();
    for (const user of users) {
      firstDayByUser.set(user.id, dateKey(user.createdAt));
    }
    const dailyMap = new Map<
      string,
      { active: Set<string>; returning: Set<string> }
    >();
    for (const [uid, days] of daysByUser) {
      const firstDay = firstDayByUser.get(uid);
      for (const day of days) {
        const record = dailyMap.get(day) ?? {
          active: new Set<string>(),
          returning: new Set<string>(),
        };
        record.active.add(uid);
        if (day !== firstDay) record.returning.add(uid);
        dailyMap.set(day, record);
      }
    }
    const dailyActive = lastNDays(30).map((date) => {
      const record = dailyMap.get(date);
      return {
        date,
        active: record ? record.active.size : 0,
        returning: record ? record.returning.size : 0,
      };
    });

    const cohorts = {
      day1: this.cohort(enriched, now, 1),
      day7: this.cohort(enriched, now, 7),
      day30: this.cohort(enriched, now, 30),
    };

    const listed = [...enriched]
      .sort(
        (a, b) =>
          b.returnVisits - a.returnVisits ||
          b.lastSeen.getTime() - a.lastSeen.getTime(),
      )
      .slice(0, 200)
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        firstSeenAt: u.firstSeen.toISOString(),
        lastSeenAt: u.lastSeen.toISOString(),
        activeDays: u.activeDays,
        returnVisits: u.returnVisits,
        daysSinceLastSeen: Math.max(
          0,
          Math.floor((now.getTime() - u.lastSeen.getTime()) / DAY_MS),
        ),
        returning: u.returnVisits >= 1,
      }));

    return AdminRetentionOverviewSchema.parse({
      generatedAt: now.toISOString(),
      totals: {
        totalUsers,
        returningUsers,
        oneTimeUsers,
        returnRate: totalUsers === 0 ? 0 : (returningUsers / totalUsers) * 100,
        avgActiveDays: Math.round(avgActiveDays * 10) / 10,
        activeLast7d,
        activeLast30d,
      },
      cohorts,
      returnsDistribution,
      dailyActive,
      users: listed,
    });
  }

  /** Of users who signed up ≥ `days` ago, how many were still active ≥ `days` later. */
  private cohort(
    enriched: Enriched[],
    now: Date,
    days: number,
  ): AdminRetentionBucket {
    const cohortStart = new Date(now.getTime() - 90 * DAY_MS);
    const cohortEnd = new Date(now.getTime() - days * DAY_MS);
    const cohort = enriched.filter(
      (u) => u.firstSeen >= cohortStart && u.firstSeen < cohortEnd,
    );
    if (cohort.length === 0) return { cohortSize: 0, returned: 0, rate: 0 };
    const returned = cohort.filter(
      (u) => u.lastSeen.getTime() >= u.firstSeen.getTime() + days * DAY_MS,
    ).length;
    return {
      cohortSize: cohort.length,
      returned,
      rate: Math.round((returned / cohort.length) * 1000) / 10,
    };
  }
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const today = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    ),
  );
  return Array.from({ length: n }, (_, index) => {
    const day = new Date(today.getTime() - (n - 1 - index) * DAY_MS);
    return day.toISOString().slice(0, 10);
  });
}
