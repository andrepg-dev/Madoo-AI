import type {
  AdminEmailChatMessage,
  AdminEmailDetail,
  AdminEmailRun,
} from "@madoo/shared";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchEmailDetail } from "@/actions/emails";
import { EmailRender } from "@/components/email-render";
import { Shell } from "@/components/shell";
import { AdminApiError } from "@/lib/api";

const numberFormatter = new Intl.NumberFormat("en-US");

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MetaGrid({ email }: { email: AdminEmailDetail }) {
  const rows: { label: string; value: string }[] = [
    { label: "User", value: email.userName ?? email.userEmail ?? "Unknown" },
    { label: "Email", value: email.userEmail ?? "—" },
    { label: "Workspace", value: email.workspaceName ?? "—" },
    { label: "Status", value: email.status },
    { label: "Created", value: formatDateTime(email.createdAt) },
  ];
  return (
    <div className="card">
      <div className="meta-grid">
        {rows.map((row) => (
          <div key={row.label}>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatHistory({ messages }: { messages: AdminEmailChatMessage[] }) {
  // The real conversation is the TEXT turns; THINKING/STATUS rows are ephemeral
  // generation noise, so we drop them here.
  const turns = messages.filter((message) => message.kind === "TEXT");
  if (turns.length === 0) {
    return <p className="empty">No chat history for this email.</p>;
  }
  return (
    <div className="chat">
      {turns.map((message) => (
        <div
          key={message.id}
          className={`chat-msg ${message.role.toLowerCase()} ${message.kind.toLowerCase()}`}
        >
          <div className="chat-role">
            <span className="who">
              {message.role === "USER"
                ? "User"
                : message.role === "ASSISTANT"
                  ? "Madoo"
                  : "System"}
            </span>
            <time>{formatDateTime(message.createdAt)}</time>
          </div>
          <p className="chat-body">{message.content}</p>
          {message.imageUrls.length > 0 ? (
            <div className="chat-images">
              {message.imageUrls.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="Attachment" />
              ))}
            </div>
          ) : null}
          {message.feedback ? (
            <p className="chat-fb">
              {message.feedback === "LIKE" ? "👍 Liked" : "👎 Disliked"}
              {message.feedbackComment ? ` — ${message.feedbackComment}` : ""}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Runs({ runs }: { runs: AdminEmailRun[] }) {
  if (runs.length === 0) return null;
  return (
    <section>
      <h2>Generation runs</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Kind</th>
              <th>Status</th>
              <th>In</th>
              <th>Out</th>
              <th>Latency</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{run.kind}</td>
                <td>{run.status}</td>
                <td>
                  {run.inputTokens === null
                    ? "—"
                    : numberFormatter.format(run.inputTokens)}
                </td>
                <td>
                  {run.outputTokens === null
                    ? "—"
                    : numberFormatter.format(run.outputTokens)}
                </td>
                <td>{run.latencyMs === null ? "—" : `${run.latencyMs} ms`}</td>
                <td>{formatDateTime(run.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let email: AdminEmailDetail;
  try {
    email = await fetchEmailDetail(id);
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
    if (error instanceof AdminApiError && error.status === 404) {
      return (
        <Shell active="emails">
          <Link className="backlink" href="/emails">
            ← Back to emails
          </Link>
          <p className="empty">Email not found.</p>
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

  const title =
    email.title ?? (email.prompt.slice(0, 80) || "Untitled email");

  return (
    <Shell active="emails" title={title}>
      <Link className="backlink" href="/emails">
        ← Back to emails
      </Link>

      <div className="email-detail">
        <div>
          <h2>Rendered email</h2>
          <EmailRender variants={email.variants} />
        </div>
        <div>
          <h2>Details</h2>
          <MetaGrid email={email} />
          <section>
            <h2>Prompt</h2>
            <div className="card">
              <p className="chat-body">{email.prompt}</p>
            </div>
          </section>
          <section>
            <h2>Chat history</h2>
            <ChatHistory messages={email.chatMessages} />
          </section>
        </div>
      </div>

      <Runs runs={email.runs} />
    </Shell>
  );
}
