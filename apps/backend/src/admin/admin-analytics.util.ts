export const DAY_MS = 86_400_000;
export const ACTIVITY_EVENTS = [
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

export type CountRow = { count: number };
export type TopTemplateRow = { name: string; count: number };
export type RatingDistributionRow = {
  rating: number;
  _count: { _all: number };
};
export type TemplateRatingRow = {
  rating: number;
  email: {
    templateId: string | null;
    template: { name: string } | null;
  };
};
export type TimeseriesBucket = {
  date: string;
  signups: number;
  loginEvents: number;
  emailsCreated: number;
  templatesCreated: number;
  feedbackSubmitted: number;
};

export function startOfUtcDay(value: Date): Date {
  const copy = new Date(value);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS);
}

export function dateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function percent(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

export function metricDelta(current: number, previous: number) {
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

export function scalarCount(rows: CountRow[]): number {
  return Number(rows[0]?.count ?? 0);
}

export function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function buildRatingDistribution(rows: RatingDistributionRow[]) {
  const counts = new Map(rows.map((row) => [row.rating, row._count._all]));
  return [1, 2, 3, 4, 5].map((stars) => ({
    stars,
    count: counts.get(stars) ?? 0,
  }));
}

export function buildPerTemplateRatingStats(rows: TemplateRatingRow[]) {
  const groups = new Map<
    string,
    { templateId: string | null; name: string; sum: number; count: number }
  >();

  rows.forEach((row) => {
    const templateId = row.email.templateId;
    const key = templateId ?? "__none__";
    const current =
      groups.get(key) ??
      {
        templateId,
        name:
          templateId === null
            ? "No template"
            : (row.email.template?.name ?? "Unknown template"),
        sum: 0,
        count: 0,
      };
    current.sum += row.rating;
    current.count += 1;
    groups.set(key, current);
  });

  return [...groups.values()]
    .map((group) => ({
      templateId: group.templateId,
      name: group.name,
      average: roundOneDecimal(group.sum / group.count),
      count: group.count,
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.average - a.average ||
        a.name.localeCompare(b.name),
    );
}

export function incrementBucket(
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

export function groupEventDates(
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

export function countByWorkspace(
  rows: Array<{ workspaceId: string; _count: { _all: number } }>,
): Map<string, number> {
  return new Map(rows.map((row) => [row.workspaceId, row._count._all]));
}

export function countByNullableUser(
  rows: Array<{ userId: string | null; _count: { _all: number } }>,
): Map<string, number> {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    if (row.userId) map.set(row.userId, row._count._all);
  });
  return map;
}

export function maxDateByNullableUser(
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

export function sumForWorkspaces(
  memberships: Array<{ workspaceId: string }>,
  counts: Map<string, number>,
): number {
  return memberships.reduce(
    (total, membership) => total + (counts.get(membership.workspaceId) ?? 0),
    0,
  );
}

export function maxDate(values: Array<Date | null>): Date | null {
  return values.reduce<Date | null>((max, value) => {
    if (!value) return max;
    if (!max || value > max) return value;
    return max;
  }, null);
}

export function scoreActivation(input: {
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

export function userStage(input: {
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

export function buildInsights(input: {
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
