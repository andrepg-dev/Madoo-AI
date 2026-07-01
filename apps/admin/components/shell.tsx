import Link from "next/link";
import { logoutAction } from "@/actions/auth";

type NavKey = "dashboard" | "emails";

export function Shell({
  active,
  title = "Madoo Admin",
  actions,
  children,
}: {
  active?: NavKey;
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="container">
      <div className="topbar">
        <div>
          <p className="eyebrow">Internal admin</p>
          <h1>{title}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {actions}
          <form action={logoutAction}>
            <button className="btn" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <nav className="nav">
        <Link className={active === "dashboard" ? "active" : ""} href="/">
          Dashboard
        </Link>
        <Link className={active === "emails" ? "active" : ""} href="/emails">
          Emails
        </Link>
      </nav>
      {children}
    </div>
  );
}
