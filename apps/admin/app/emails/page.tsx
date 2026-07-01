import type { AdminEmailList, AdminEmailStatus } from "@madoo/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchEmails } from "@/actions/emails";
import { AreaChart, ChartLegend, DonutChart } from "@/components/charts";
import { Shell } from "@/components/shell";
import { AdminApiError } from "@/lib/api";

const PAGE_SIZE = 20;

const STATUS_META: Record<
  AdminEmailStatus,
  { label: string; color: string; badge: string }
> = {
  READY: { label: "Ready", color: "#0f9f6e", badge: "ready" },
  ERROR: { label: "Error", color: "#d92d20", badge: "error" },
  GENERATING: { label: "Generating", color: "#b7791f", badge: "generating" },
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

function StatusBadge({ status }: { status: AdminEmailStatus }) {
  const meta = STATUS_META[status];
  return <span className={`badge ${meta.badge}`}>{meta.label}</span>;
}

function Charts({ data }: { data: AdminEmailList }) {
  const segments = data.statusBreakdown.map((entry) => ({
    label: STATUS_META[entry.status].label,
    value: entry.count,
    color: STATUS_META[entry.status].color,
  }));
  const volume = data.dailyVolume.map((point) => ({
    label: point.date.slice(5),
    value: point.count,
  }));

  return (
    <section className="split-section">
      <div className="chart-card">
        <h3>Emails created — last 14 days</h3>
        <p className="chart-sub">{data.total} emails total</p>
        <AreaChart data={volume} color="#2563eb" />
      </div>
      <div className="chart-card">
        <h3>Status breakdown</h3>
        <p className="chart-sub">Across all emails</p>
        <div className="donut-row">
          <DonutChart segments={segments} total={data.total} />
          <ChartLegend segments={segments} />
        </div>
      </div>
    </section>
  );
}

function EmailsTable({ data }: { data: AdminEmailList }) {
  if (data.items.length === 0) {
    return <p className="empty">No emails match this search.</p>;
  }
  return (
    <div className="table-wrap">
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
                <Link
                  href={`/emails/${email.id}`}
                  style={{ display: "block", textDecoration: "none" }}
                >
                  <strong>{email.title ?? email.latestSubject ?? "Untitled email"}</strong>
                  <span className="clamp">{email.prompt}</span>
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
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const search = params.q?.trim() || "";

  let data: AdminEmailList;
  try {
    data = await fetchEmails({ page, pageSize: PAGE_SIZE, search });
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      redirect("/login");
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return (
        <Shell active="emails">
          <p className="empty">
            This account is not an admin. Add its email to ADMIN_EMAILS on the
            backend.
          </p>
        </Shell>
      );
    }
    if (error instanceof AdminApiError && error.status === 503) {
      return (
        <Shell active="emails">
          <p className="empty">{error.message}</p>
        </Shell>
      );
    }
    throw error;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const qs = (target: number) => {
    const sp = new URLSearchParams();
    if (search) sp.set("q", search);
    if (target > 1) sp.set("page", String(target));
    const str = sp.toString();
    return str ? `/emails?${str}` : "/emails";
  };

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
        <EmailsTable data={data} />
        {totalPages > 1 ? (
          <div className="pager">
            {page > 1 ? (
              <Link className="btn" href={qs(page - 1)}>
                Previous
              </Link>
            ) : null}
            <span className="btn" aria-disabled style={{ cursor: "default" }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link className="btn" href={qs(page + 1)}>
                Next
              </Link>
            ) : null}
          </div>
        ) : null}
      </section>
    </Shell>
  );
}
