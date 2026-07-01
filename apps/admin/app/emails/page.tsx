import type { AdminEmailList, AdminEmailStatus } from "@madoo/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchEmails } from "@/actions/emails";
import { DonutChart, Heatmap, LineChart } from "@/components/charts-interactive";
import { Shell } from "@/components/shell";
import { AdminApiError } from "@/lib/api";

const STATUS_META: Record<
  AdminEmailStatus,
  { label: string; color: string; badge: string }
> = {
  READY: { label: "Ready", color: "#0f9f6e", badge: "ready" },
  ERROR: { label: "Error", color: "#dc2626", badge: "error" },
  GENERATING: { label: "Generating", color: "#f59e0b", badge: "generating" },
  DRAFT: { label: "Draft", color: "#94a3b8", badge: "draft" },
};

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-madoo-paper p-5 shadow-[0_0_0_0.5px_rgb(17_24_39/0.1)]">
      <h2 className="text-sm font-bold text-madoo-text">{title}</h2>
      {desc ? (
        <p className="mb-4 mt-0.5 text-sm leading-snug text-madoo-muted">
          {desc}
        </p>
      ) : (
        <div className="mb-4" />
      )}
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: AdminEmailStatus }) {
  const meta = STATUS_META[status];
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl bg-madoo-paper p-3.5 shadow-[0_0_0_0.5px_rgb(17_24_39/0.1)]">
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-madoo-faint">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold leading-none text-madoo-text">
        {value.toLocaleString("en-US")}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-madoo-muted">{hint}</p>
    </div>
  );
}

function Charts({ data }: { data: AdminEmailList }) {
  const statusSegments = data.statusBreakdown
    .filter((entry) => entry.count > 0)
    .map((entry) => ({
      label: STATUS_META[entry.status].label,
      value: entry.count,
      color: STATUS_META[entry.status].color,
    }));

  const planSegments = [
    { label: "Paid", value: data.plans.paid, color: "#7c3aed" },
    { label: "Free trial", value: data.plans.trial, color: "#f59e0b" },
    { label: "Free", value: data.plans.free, color: "#cbd5e1" },
  ];

  const readyCount =
    data.statusBreakdown.find((entry) => entry.status === "READY")?.count ?? 0;

  return (
    <div className="mb-5 flex flex-col gap-4">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Total emails" value={data.total} hint="Created all-time" />
        <Kpi
          label="Emails exported"
          value={data.exports.emailsExported}
          hint={`${data.exports.totalExports.toLocaleString("en-US")} exports total`}
        />
        <Kpi label="Ready" value={readyCount} hint="Finished generating" />
        <Kpi
          label="Paying users"
          value={data.plans.paid}
          hint={`${data.plans.trial} on free trial`}
        />
      </section>

      <Card
        title="Emails created — last 14 days"
        desc={`${data.total} emails total. Hover any point for the exact count.`}
      >
        <LineChart
          labels={data.dailyVolume.map((p) => shortDate(p.date))}
          tooltipLabels={data.dailyVolume.map((p) => longDate(p.date))}
          series={[
            {
              name: "Emails",
              color: "#7c3aed",
              points: data.dailyVolume.map((p) => p.count),
            },
          ]}
          area
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Status breakdown" desc="All emails, by generation status.">
          <DonutChart segments={statusSegments} centerLabel="Emails" />
        </Card>
        <Card
          title="User plans"
          desc="How many accounts are paying, on a free trial, or free."
        >
          <DonutChart segments={planSegments} centerLabel="Users" />
        </Card>
      </div>

      <Card
        title="When emails are created"
        desc="Darker = more emails. Rows are weekdays, columns are the hour of day (UTC). Hover a cell for the count."
      >
        <Heatmap cells={data.heatmap} />
      </Card>
    </div>
  );
}

function EmailsTable({ data }: { data: AdminEmailList }) {
  if (data.items.length === 0) {
    return <p className="empty">No emails match this search.</p>;
  }
  return (
    <div
      className="table-wrap"
      style={{ maxHeight: "72vh", overflowY: "auto" }}
    >
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>User</th>
            <th>Status</th>
            <th>Variants</th>
            <th>Chat</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((email) => (
            <tr key={email.id} className="linkrow">
              <td>
                <Link href={`/emails/${email.id}`} className="email-cell">
                  {email.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="email-thumb"
                      src={email.previewUrl}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span className="email-thumb email-thumb-empty" />
                  )}
                  <span className="email-cell-text">
                    <strong>
                      {email.title ?? email.latestSubject ?? "Untitled email"}
                    </strong>
                    <span className="clamp">{email.prompt}</span>
                  </span>
                </Link>
              </td>
              <td>
                {email.userName ?? email.userEmail ?? "Unknown"}
                {email.workspaceName ? (
                  <span>{email.workspaceName}</span>
                ) : null}
              </td>
              <td>
                <StatusBadge status={email.status} />
              </td>
              <td>{email.variantCount}</td>
              <td>{email.chatMessageCount}</td>
              <td>{formatDateTime(email.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function EmailsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() || "";

  let data: AdminEmailList;
  try {
    data = await fetchEmails({ page: 1, pageSize: 500, search });
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      redirect("/login");
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return (
        <Shell active="emails" title="Emails">
          <p className="empty">
            This account is not an admin. Add its email to ADMIN_EMAILS on the
            backend.
          </p>
        </Shell>
      );
    }
    if (error instanceof AdminApiError && error.status === 503) {
      return (
        <Shell active="emails" title="Emails">
          <p className="empty">{error.message}</p>
        </Shell>
      );
    }
    throw error;
  }

  return (
    <Shell active="emails" title="Generated emails">
      <form className="toolbar" action="/emails" method="get">
        <input
          className="search"
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search prompt, title, or user email…"
        />
        <button className="btn" type="submit">
          Search
        </button>
      </form>

      <Charts data={data} />

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2>{data.items.length} emails</h2>
        </div>
        <EmailsTable data={data} />
      </section>
    </Shell>
  );
}
