import { redirect } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { fetchFeedback } from "@/actions/feedback";
import { AdminApiError } from "@/lib/api";

const PAGE_SIZE = 50;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" aria-label={`${rating} of 5`}>
      {"★".repeat(rating)}
      <span style={{ color: "var(--border)" }}>{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  let data;
  try {
    data = await fetchFeedback({ page, pageSize: PAGE_SIZE });
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      redirect("/login");
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return (
        <div className="container">
          <div className="topbar">
            <h1>Madoo Admin</h1>
            <form action={logoutAction}>
              <button className="btn" type="submit">
                Sign out
              </button>
            </form>
          </div>
          <p className="empty">
            This account is not an admin. Add its email to ADMIN_EMAILS on the
            backend.
          </p>
        </div>
      );
    }
    throw error;
  }

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));

  return (
    <div className="container">
      <div className="topbar">
        <h1>Feedback ({data.total})</h1>
        <form action={logoutAction}>
          <button className="btn" type="submit">
            Sign out
          </button>
        </form>
      </div>

      {data.items.length === 0 ? (
        <p className="empty">No feedback yet.</p>
      ) : (
        data.items.map((item) => (
          <div className="card" key={item.id}>
            <div className="feedback-head">
              <Stars rating={item.rating} />
              <span className="muted">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="message">{item.message}</p>
            <p className="muted">
              {item.userName ? `${item.userName} · ` : ""}
              {item.userEmail}
              {item.page ? ` · ${item.page}` : ""}
            </p>
          </div>
        ))
      )}

      {totalPages > 1 ? (
        <div className="pager">
          {page > 1 ? (
            <a className="btn" href={`/?page=${page - 1}`}>
              ← Newer
            </a>
          ) : null}
          <span className="muted" style={{ alignSelf: "center" }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <a className="btn" href={`/?page=${page + 1}`}>
              Older →
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
