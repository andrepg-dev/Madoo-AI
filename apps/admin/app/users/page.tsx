import type {
  AdminRetentionOverview,
  AdminRetentionUser,
} from "@madoo/shared";
import { redirect } from "next/navigation";
import { fetchRetention } from "@/actions/retention";
import { BarChart, LineChart } from "@/components/charts-interactive";
import { Shell } from "@/components/shell";
import { AdminApiError } from "@/lib/api";

function relativeDays(days: number | null): string {
  if (days === null) return "—";
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
}

function statusOf(user: AdminRetentionUser): {
  label: string;
  cls: string;
} {
  const since = user.daysSinceLastSeen ?? 999;
  if (!user.returning) {
    return { label: "One-time", cls: "bg-black/5 text-madoo-muted" };
  }
  if (since <= 7) {
    return { label: "Active", cls: "bg-madoo-green/12 text-madoo-green" };
  }
  if (since <= 30) {
    return { label: "Returning", cls: "bg-madoo-blue/12 text-madoo-blue" };
  }
  return { label: "Dormant", cls: "bg-madoo-amber/14 text-madoo-amber" };
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-madoo-paper p-3.5 shadow-[0_0_0_0.5px_rgb(17_24_39/0.1)]">
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-madoo-faint">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold leading-none text-madoo-text">
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] leading-snug text-madoo-muted">{hint}</p>
    </div>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-madoo-paper p-5 shadow-[0_0_0_0.5px_rgb(17_24_39/0.1)]">
      <h2 className="text-sm font-bold text-madoo-text">{title}</h2>
      <p className="mb-4 mt-0.5 text-xs leading-snug text-madoo-muted">{desc}</p>
      {children}
    </div>
  );
}

function Retention({ data }: { data: AdminRetentionOverview }) {
  const labels = data.dailyActive.map((point) => point.date.slice(5));
  const returnRate = `${Math.round(data.totals.returnRate)}%`;

  return (
    <div className="flex flex-col gap-5">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Return rate"
          value={returnRate}
          hint={`${data.totals.returningUsers} of ${data.totals.totalUsers} users came back at least once`}
        />
        <Kpi
          label="Returning users"
          value={String(data.totals.returningUsers)}
          hint={`${data.totals.oneTimeUsers} came once and never returned`}
        />
        <Kpi
          label="Active last 7 days"
          value={String(data.totals.activeLast7d)}
          hint={`${data.totals.activeLast30d} active in the last 30 days`}
        />
        <Kpi
          label="Avg visits / user"
          value={data.totals.avgActiveDays.toFixed(1)}
          hint="Distinct days a user did something (a proxy for visits)"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card
          title="Daily active vs returning"
          desc="Active = anyone who did something that day. Returning = someone active on a day after they first signed up. Hover for exact numbers."
        >
          <LineChart
            labels={labels}
            series={[
              {
                name: "Active",
                color: "#2563eb",
                points: data.dailyActive.map((p) => p.active),
              },
              {
                name: "Returning",
                color: "#0f9f6e",
                points: data.dailyActive.map((p) => p.returning),
              },
            ]}
          />
          <div className="mt-3 flex gap-4 text-xs text-madoo-muted">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-madoo-blue" />
              Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-madoo-green" />
              Returning
            </span>
          </div>
        </Card>

        <Card
          title="How often users come back"
          desc="Each user grouped by how many separate days they returned after signing up. Hover a bar for the count."
        >
          <BarChart
            bars={data.returnsDistribution.map((bucket) => ({
              label: bucket.label.replace(" returned", "").replace(" return", "").replace(" returns", ""),
              value: bucket.count,
              hint: bucket.label,
            }))}
            color="#2563eb"
          />
        </Card>
      </section>

      <Card
        title="Cohort retention"
        desc="Of users who signed up long enough ago, the share who were still active 1, 7, and 30 days later. Higher is stickier."
      >
        <div className="grid grid-cols-3 gap-4">
          {(
            [
              ["Day 1", data.cohorts.day1],
              ["Day 7", data.cohorts.day7],
              ["Day 30", data.cohorts.day30],
            ] as const
          ).map(([label, bucket]) => (
            <div key={label} className="text-center">
              <div className="relative mx-auto h-2 w-full overflow-hidden rounded-full bg-black/5">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-madoo-ink"
                  style={{ width: `${Math.min(100, bucket.rate)}%` }}
                />
              </div>
              <p className="mt-2 text-xl font-semibold text-madoo-text">
                {bucket.rate}%
              </p>
              <p className="text-xs text-madoo-muted">
                {label} · {bucket.returned}/{bucket.cohortSize}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="Who comes back"
        desc="Users ranked by how many times they returned. Returns = extra days active beyond their first."
      >
        {data.users.length === 0 ? (
          <p className="py-6 text-center text-sm text-madoo-muted">
            No users yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-madoo-faint">
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3" title="Distinct days the user was active">
                    Visits
                  </th>
                  <th className="py-2 pr-3" title="Days active beyond their first">
                    Returns
                  </th>
                  <th className="py-2 pr-3">Last seen</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => {
                  const status = statusOf(user);
                  return (
                    <tr
                      key={user.id}
                      className="border-t border-madoo-line/70"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold text-madoo-text">
                          {user.name ?? user.email}
                        </div>
                        {user.name ? (
                          <div className="text-xs text-madoo-muted">
                            {user.email}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums text-madoo-text">
                        {user.activeDays}
                      </td>
                      <td className="py-2.5 pr-3 tabular-nums font-semibold text-madoo-text">
                        {user.returnVisits}
                      </td>
                      <td className="py-2.5 pr-3 text-madoo-muted">
                        {relativeDays(user.daysSinceLastSeen)}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default async function UsersPage() {
  let data: AdminRetentionOverview;
  try {
    data = await fetchRetention();
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      redirect("/login");
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return (
        <Shell active="users" title="Users">
          <p className="py-8 text-center text-madoo-muted">
            This account is not an admin. Add its email to ADMIN_EMAILS on the
            backend.
          </p>
        </Shell>
      );
    }
    if (error instanceof AdminApiError && error.status === 503) {
      return (
        <Shell active="users" title="Users">
          <p className="py-8 text-center text-madoo-muted">{error.message}</p>
        </Shell>
      );
    }
    throw error;
  }

  return (
    <Shell
      active="users"
      title="User retention"
      subtitle="Who comes back to Madoo, how often, and when — so you can tell one-time visitors from real, sticky users."
    >
      <Retention data={data} />
    </Shell>
  );
}
