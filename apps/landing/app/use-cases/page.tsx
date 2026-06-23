import type { Metadata } from "next";
import Link from "next/link";
import { LandingHeader } from "../../components/LandingHeader";

export const metadata: Metadata = {
  title: "Email Marketing Use Cases — Madoo AI",
  description:
    "Explore how Madoo AI helps ecommerce, SaaS, agencies, creators, and startups create email campaigns from a prompt.",
};

const headerCopy = {
  useCases: "Use cases",
  emailTemplates: "Email Templates",
  pricing: "Pricing",
  login: "Login",
  getStarted: "Get started",
  mobileMenu: "Open navigation",
};

type UseCaseIconName = "commerce" | "saas" | "agency" | "creator" | "startup";

const useCases = {
  eyebrow: "Use cases",
  title: "Emails for campaign work",
  description:
    "Pick the job you need to ship. Madoo turns context, audience, and goal into a reusable template your team can review and export.",
  items: [
    {
      audience: "E-commerce",
      title: "Promotions, drops, and win-back emails",
      body: "Create seasonal sales, product launches, abandoned-cart flows, and loyalty campaigns without rebuilding layouts.",
      accent: "#7c6ff6",
      accentSoft: "#f0edff",
      icon: "commerce" as UseCaseIconName,
    },
    {
      audience: "SaaS",
      title: "Lifecycle emails for product teams",
      body: "Turn product updates, onboarding steps, feature launches, and trial nudges into clear branded campaigns.",
      accent: "#3b82f6",
      accentSoft: "#edf5ff",
      icon: "saas" as UseCaseIconName,
    },
    {
      audience: "Agencies",
      title: "Reusable client campaign systems",
      body: "Standardize offers, newsletters, announcements, and approval-ready templates across client accounts.",
      accent: "#0f766e",
      accentSoft: "#ecf8f6",
      icon: "agency" as UseCaseIconName,
    },
    {
      audience: "Creators",
      title: "Newsletters and audience updates",
      body: "Draft sponsor slots, announcements, essays, and product drops with consistent structure and tone.",
      accent: "#c084fc",
      accentSoft: "#f7f0ff",
      icon: "creator" as UseCaseIconName,
    },
    {
      audience: "Startups",
      title: "Launches, waitlists, and milestones",
      body: "Move faster on waitlist emails, investor updates, beta invites, and launch announcements.",
      accent: "#111827",
      accentSoft: "#f1f2f4",
      icon: "startup" as UseCaseIconName,
    },
  ],
};

function UseCaseBackgroundIcon({
  accent,
  accentSoft,
  icon,
}: {
  accent: string;
  accentSoft: string;
  icon: UseCaseIconName;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-6 -right-6 z-0 flex h-36 w-36 rotate-[-5deg] items-center justify-center rounded-[1.75rem] border border-white/70 bg-white/65 opacity-60 shadow-[0_24px_70px_rgb(30_27_22/0.08)]"
      style={{ backgroundColor: accentSoft, color: accent }}
    >
      <UseCaseIcon icon={icon} />
    </div>
  );
}

function UseCaseIcon({ icon }: { icon: UseCaseIconName }) {
  const iconClassName = "h-20 w-20";
  const strokeProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
  };

  switch (icon) {
    case "commerce":
      return (
        <svg
          className={iconClassName}
          viewBox="0 0 32 32"
          role="img"
          focusable="false"
        >
          <path {...strokeProps} d="M8 10h16l-1.4 17H9.4L8 10Z" />
          <path {...strokeProps} d="M12 10a4 4 0 0 1 8 0" />
          <path {...strokeProps} d="M12.5 17h7" />
          <path {...strokeProps} d="M12.5 21h5" opacity="0.58" />
        </svg>
      );
    case "saas":
      return (
        <svg
          className={iconClassName}
          viewBox="0 0 32 32"
          role="img"
          focusable="false"
        >
          <rect {...strokeProps} x="5" y="7" width="22" height="16" rx="3" />
          <path {...strokeProps} d="M5 12h22" />
          <path {...strokeProps} d="M10 18h6" opacity="0.58" />
          <path {...strokeProps} d="m20 17 5 3.5-3 1 1.6 3.5-2 1-1.7-3.4-2.5 2L20 17Z" />
        </svg>
      );
    case "agency":
      return (
        <svg
          className={iconClassName}
          viewBox="0 0 32 32"
          role="img"
          focusable="false"
        >
          <rect {...strokeProps} x="5" y="10" width="22" height="16" rx="3" />
          <path {...strokeProps} d="M12 10V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path {...strokeProps} d="M5 16h22" />
          <path {...strokeProps} d="M14 16v2h4v-2" opacity="0.58" />
        </svg>
      );
    case "creator":
      return (
        <svg
          className={iconClassName}
          viewBox="0 0 32 32"
          role="img"
          focusable="false"
        >
          <rect {...strokeProps} x="6" y="7" width="20" height="18" rx="3" />
          <path {...strokeProps} d="M10 12h8" />
          <path {...strokeProps} d="M10 16h12" opacity="0.58" />
          <path {...strokeProps} d="M10 20h7" opacity="0.58" />
          <path {...strokeProps} d="m20 11 4 3.5-4 3.5" />
        </svg>
      );
    case "startup":
      return (
        <svg
          className={iconClassName}
          viewBox="0 0 32 32"
          role="img"
          focusable="false"
        >
          <path {...strokeProps} d="M18.2 6.4c3.8.7 6.7 3.6 7.4 7.4L18 21.4 10.6 14l7.6-7.6Z" />
          <path {...strokeProps} d="m13 20.8-4.6 4.6 1-6" opacity="0.58" />
          <path {...strokeProps} d="m11.2 13-6 .9 4.6-4.6" opacity="0.58" />
          <circle {...strokeProps} cx="20.8" cy="11.2" r="2" />
        </svg>
      );
  }
}

export default function UseCasesPage() {
  return (
    <main className="relative min-h-screen w-full bg-madoo-page font-ibm-plex-sans">
      <LandingHeader
        copy={headerCopy}
        scrolledBackgroundClassName="bg-madoo-page/80 backdrop-blur"
      />

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end mb-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f6961]">
              {useCases.eyebrow}
            </p>
            <h1 className="mt-3 text-4xl font-semibold max-w-[18ch] leading-[0.98] tracking-normal text-[#171717] sm:text-5xl lg:text-[3.2rem]">
              {useCases.title}
            </h1>
          </div>
          {/* <p className="max-w-xl text-base leading-7 text-[#6f6961] items-start">
            {useCases.description}
          </p> */}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {useCases.items.map((item) => (
            <article
              key={item.audience}
              className="madoo-paper-border relative isolate flex min-h-96 overflow-hidden rounded-lg bg-white p-5"
            >
              <UseCaseBackgroundIcon
                accent={item.accent}
                accentSoft={item.accentSoft}
                icon={item.icon}
              />

              <div className="relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f6961]">
                  {item.audience}
                </p>
                <h2 className="mt-4 text-lg font-semibold leading-6 text-[#171717]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#6f6961]">
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/templates"
            className="inline-flex h-11 w-fit items-center justify-center rounded-lg bg-madoo-ink px-5 text-sm font-semibold text-white transition hover:bg-madoo-ink-hover"
          >
            Browse email templates
          </Link>
          <Link
            href="/pricing"
            className="madoo-paper-border madoo-paper-border-hover inline-flex h-11 w-fit items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-madoo-ink transition"
          >
            View pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
