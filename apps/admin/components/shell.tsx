import Link from "next/link";
import { logoutAction } from "@/actions/auth";

type NavKey = "dashboard" | "users" | "emails";

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "dashboard", label: "Overview", href: "/" },
  { key: "users", label: "Users", href: "/users" },
  { key: "emails", label: "Emails", href: "/emails" },
];

export function Shell({
  active,
  title = "Madoo Admin",
  subtitle,
  children,
}: {
  active?: NavKey;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-madoo-page">
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-6 sm:px-7">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-madoo-faint">
              Internal admin
            </p>
            <h1 className="text-2xl font-semibold leading-tight text-madoo-text">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 max-w-xl text-sm text-madoo-muted">{subtitle}</p>
            ) : null}
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-madoo-faint transition hover:bg-black/5 hover:text-madoo-text"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              >
                <path
                  d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5M13 7V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
        </header>

        <nav className="mt-5 flex gap-1 border-b border-madoo-line">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={
                item.key === active
                  ? "-mb-px border-b-2 border-madoo-ink px-3 py-2.5 text-sm font-semibold text-madoo-text"
                  : "-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-madoo-muted transition hover:text-madoo-text"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="pt-7">{children}</main>
      </div>
    </div>
  );
}
