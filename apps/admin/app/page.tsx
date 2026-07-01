import type {
  AdminDashboard,
  AdminFunnelStep,
  AdminInsight,
  AdminMetricDelta,
  AdminRecentTemplate,
  AdminRecentUser,
  AdminRetentionBucket,
  AdminTimeseriesPoint,
  AdminTopTemplate,
  Feedback,
} from "@madoo/shared";
import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { fetchDashboard } from "@/actions/dashboard";
import { AdminApiError } from "@/lib/api";

const numberFormatter = new Intl.NumberFormat("en-US");

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function changeLabel(delta: AdminMetricDelta): string {
  const sign = delta.changePercent > 0 ? "+" : "";
  return `${sign}${formatPercent(delta.changePercent)} vs prev`;
}

function Shell({
  children,
  title = "Madoo Admin",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="container">
      <div className="topbar">
        <div>
          <p className="eyebrow">Internal admin</p>
          <h1>{title}</h1>
        </div>
        <form action={logoutAction}>
          <button className="btn" type="submit">
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </div>
  );
}

function DeltaCard({
  label,
  delta,
}: {
  label: string;
  delta: AdminMetricDelta;
}) {
  const tone =
    delta.changePercent > 0 ? "good" : delta.changePercent < 0 ? "warning" : "";
  return (
    <div className="card compact-card">
      <span className="muted">{label}</span>
      <strong>{formatNumber(delta.current)}</strong>
      <p className={`change ${tone}`}>{changeLabel(delta)}</p>
    </div>
  );
}

function RetentionCard({
  label,
  bucket,
}: {
  label: string;
  bucket: AdminRetentionBucket;
}) {
  return (
    <div className="card compact-card">
      <span className="muted">{label}</span>
      <strong>{formatPercent(bucket.rate)}</strong>
      <p>
        {formatNumber(bucket.returned)} of {formatNumber(bucket.cohortSize)}
      </p>
    </div>
  );
}

function TrendBars({ points }: { points: AdminTimeseriesPoint[] }) {
  const max = Math.max(
    1,
    ...points.map(
      (point) =>
        point.signups +
        point.loginEvents +
        point.emailsCreated +
        point.templatesCreated +
        point.feedbackSubmitted,
    ),
  );

  return (
    <div className="trend-bars" aria-label="14 day activity trend">
      {points.map((point) => {
        const total =
          point.signups +
          point.loginEvents +
          point.emailsCreated +
          point.templatesCreated +
          point.feedbackSubmitted;
        const height = Math.max(8, Math.round((total / max) * 96));
        return (
          <div className="trend-column" key={point.date}>
            <div
              className="trend-bar"
              style={{ height }}
              title={`${point.date}: ${total} events`}
            />
            <span>{point.date.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Funnel({ steps }: { steps: AdminFunnelStep[] }) {
  const total = steps[0]?.count ?? 0;
  return (
    <div className="funnel">
      {steps.map((step) => (
        <div className="funnel-row" key={step.key}>
          <div className="funnel-label">
            <strong>{step.label}</strong>
            <span>
              {formatNumber(step.count)} users / {formatPercent(step.rateFromTotal)}
            </span>
          </div>
          <div className="progress" aria-label={`${step.label} ${step.count}`}>
            <span style={{ width: `${total ? step.rateFromTotal : 0}%` }} />
          </div>
          <span className="funnel-step-rate">
            {formatPercent(step.rateFromPrevious)}
          </span>
        </div>
      ))}
    </div>
  );
}

function RecentUsers({ users }: { users: AdminRecentUser[] }) {
  if (users.length === 0) return <p className="empty">No users yet.</p>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Stage</th>
            <th>Score</th>
            <th>Emails</th>
            <th>Templates</th>
            <th>Feedback</th>
            <th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <strong>{user.name ?? user.email}</strong>
                <span>{user.name ? user.email : "No profile name"}</span>
              </td>
              <td>{user.stage}</td>
              <td>{user.activationScore}</td>
              <td>{formatNumber(user.emailCount)}</td>
              <td>{formatNumber(user.customTemplateCount)}</td>
              <td>{formatNumber(user.feedbackCount + user.supportTicketCount)}</td>
              <td>{formatDateTime(user.lastActivityAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TemplateActivity({ templates }: { templates: AdminRecentTemplate[] }) {
  if (templates.length === 0) {
    return <p className="empty">No template activity yet.</p>;
  }
  return (
    <div className="activity-list">
      {templates.map((template) => (
        <div className="activity-row" key={`${template.source}-${template.id}`}>
          <div>
            <strong>{template.name}</strong>
            <span>
              {template.source} / {template.actorName ?? template.actorEmail ?? "Unknown user"}
              {template.workspaceName ? ` / ${template.workspaceName}` : ""}
            </span>
          </div>
          <time>{formatDateTime(template.createdAt)}</time>
        </div>
      ))}
    </div>
  );
}

function FeedbackList({ items }: { items: Feedback[] }) {
  if (items.length === 0) return <p className="empty">No feedback yet.</p>;
  return (
    <div className="activity-list">
      {items.map((item) => (
        <div className="activity-row feedback-row" key={item.id}>
          <div>
            <strong>{item.rating}/5 from {item.userName ?? item.userEmail}</strong>
            <p>{item.message}</p>
            <span>
              {item.userEmail}
              {item.page ? ` / ${item.page}` : ""}
            </span>
          </div>
          <time>{formatDateTime(item.createdAt)}</time>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ data }: { data: AdminDashboard }) {
  const firstEmail = data.activationFunnel.find(
    (step: AdminFunnelStep) => step.key === "first_email",
  );

  return (
    <>
      <div className="generated">
        Generated {formatDateTime(data.generatedAt)}
      </div>

      <section className="metric-grid">
        <MetricCard label="Total users" value={formatNumber(data.summary.totalUsers)} detail={`${formatNumber(data.summary.newUsers7d)} new in 7d`} />
        <MetricCard label="Active users" value={formatNumber(data.summary.activeUsers7d)} detail={`${formatNumber(data.summary.activeUsers30d)} in 30d`} />
        <MetricCard label="Logged in today" value={formatNumber(data.summary.loggedInUsers24h)} detail={`${formatNumber(data.summary.loggedInUsers7d)} in 7d`} />
        <MetricCard label="Comebacks" value={formatNumber(data.summary.returningUsers30d)} detail="Returned after first contact" />
        <MetricCard label="Activation" value={formatPercent(firstEmail?.rateFromTotal ?? 0)} detail="Created first email" />
        <MetricCard label="Feedback avg" value={data.summary.averageFeedbackRating30d === null ? "None" : `${data.summary.averageFeedbackRating30d.toFixed(1)}/5`} detail={`${formatNumber(data.summary.feedbackTotal)} total notes`} />
      </section>

      <section>
        <h2>Signals</h2>
        <div className="insight-grid">
          {data.insights.map((insight: AdminInsight) => (
            <div className={`insight-card ${insight.tone}`} key={insight.label}>
              <span>{insight.label}</span>
              <strong>{insight.value}</strong>
              <p>{insight.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="split-section">
        <div>
          <h2>Growth</h2>
          <div className="delta-grid">
            <DeltaCard label="Signups" delta={data.weekOverWeek.signups} />
            <DeltaCard label="Active users" delta={data.weekOverWeek.activeUsers} />
            <DeltaCard label="Template actions" delta={data.weekOverWeek.templatesCreated} />
            <DeltaCard label="Feedback" delta={data.weekOverWeek.feedbackSubmitted} />
          </div>
        </div>
        <div>
          <h2>Daily motion</h2>
          <TrendBars points={data.timeseries} />
        </div>
      </section>

      <section className="split-section">
        <div>
          <h2>Activation funnel</h2>
          <Funnel steps={data.activationFunnel} />
        </div>
        <div>
          <h2>Retention</h2>
          <div className="delta-grid">
            <RetentionCard label="Day 1" bucket={data.retention.day1} />
            <RetentionCard label="Day 7" bucket={data.retention.day7} />
            <RetentionCard label="Day 30" bucket={data.retention.day30} />
          </div>
        </div>
      </section>

      <section>
        <h2>Product use</h2>
        <div className="metric-grid secondary">
          <MetricCard label="Emails created 30d" value={formatNumber(data.usage.emailsCreated30d)} />
          <MetricCard label="Custom templates 30d" value={formatNumber(data.usage.customTemplatesCreated30d)} />
          <MetricCard label="Prebuilt uses 30d" value={formatNumber(data.usage.prebuiltTemplatesUsed30d)} />
          <MetricCard label="Community shares 30d" value={formatNumber(data.usage.communityTemplatesShared30d)} />
          <MetricCard label="Connected users" value={formatNumber(data.usage.connectedUsersTotal)} detail={`${formatNumber(data.usage.providerConnectionsTotal)} connections`} />
          <MetricCard label="Generation failures" value={formatPercent(data.usage.generationFailureRate30d)} detail={`${formatNumber(data.usage.failedGenerationRuns30d)} of ${formatNumber(data.usage.generationRuns30d)} runs`} />
        </div>
      </section>

      <section>
        <h2>Recent users</h2>
        <RecentUsers users={data.recentUsers} />
      </section>

      <section className="split-section">
        <div>
          <h2>Template activity</h2>
          <TemplateActivity templates={data.recentTemplates} />
        </div>
        <div>
          <h2>Top template use</h2>
          {data.topTemplates.length === 0 ? (
            <p className="empty">No template use yet.</p>
          ) : (
            <div className="activity-list">
              {data.topTemplates.map((template: AdminTopTemplate) => (
                <div className="activity-row" key={template.name}>
                  <strong>{template.name}</strong>
                  <span>{formatNumber(template.count)} uses</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2>Recent feedback</h2>
        <FeedbackList items={data.recentFeedback} />
      </section>
    </>
  );
}

export default async function AdminPage() {
  let data: AdminDashboard;
  try {
    data = await fetchDashboard();
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      redirect("/login");
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return (
        <Shell>
          <p className="empty">
            This account is not an admin. Add its email to ADMIN_EMAILS on the backend.
          </p>
        </Shell>
      );
    }
    if (error instanceof AdminApiError && error.status === 503) {
      return (
        <Shell>
          <p className="empty">{error.message}</p>
        </Shell>
      );
    }
    throw error;
  }

  return (
    <Shell title="Product dashboard">
      <Dashboard data={data} />
    </Shell>
  );
}
