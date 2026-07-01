import Link from "next/link";

type NavKey = "dashboard" | "users" | "emails";

const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: "dashboard", label: "Overview", href: "/" },
  { key: "users", label: "Users", href: "/users" },
  { key: "emails", label: "Emails", href: "/emails" },
];

export function Shell({
  active,
  title = "Madoo Admin",
  children,
}: {
  active?: NavKey;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-madoo-page">
      <div className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-6 sm:px-7">
        <header>
          <h1 className="text-2xl font-semibold leading-tight text-madoo-text">
            {title}
          </h1>
        </header>

        <nav className="mt-4 flex gap-1 border-b border-madoo-line">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={
                item.key === active
                  ? "-mb-px border-b-2 border-madoo-ink px-3 py-2.5 text-sm font-semibold text-madoo-text no-underline"
                  : "-mb-px border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-madoo-muted no-underline transition hover:text-madoo-text"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="pt-6">{children}</main>
      </div>
    </div>
  );
}
