import Link from "next/link";
import { LandingHeader } from "./LandingHeader";

export type LegalLocale = "en" | "es";

export type LegalSection = {
  heading: string;
  blocks: Array<{ kind: "p"; text: string } | { kind: "ul"; items: string[] }>;
};

export type LegalContent = {
  title: string;
  intro: string;
  lastUpdatedLabel: string;
  sections: LegalSection[];
};

export const legalHeaderCopy: Record<
  LegalLocale,
  React.ComponentProps<typeof LandingHeader>["copy"]
> = {
  en: {
    useCases: "Use cases",
    emailTemplates: "Email Templates",
    pricing: "Pricing",
    login: "Login",
    getStarted: "Get started",
    mobileMenu: "Open navigation",
  },
  es: {
    useCases: "Casos de uso",
    emailTemplates: "Plantillas de email",
    pricing: "Precios",
    login: "Iniciar sesión",
    getStarted: "Empezar",
    mobileMenu: "Abrir navegación",
  },
};

export function LegalDocument({
  locale,
  content,
  lastUpdated,
}: {
  locale: LegalLocale;
  content: LegalContent;
  lastUpdated: string;
}) {
  const homeHref = locale === "es" ? "/es" : "/";

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-white font-ibm-plex-sans">
      <LandingHeader copy={legalHeaderCopy[locale]} />

      <section className="relative z-10 w-full">
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-20 sm:px-8 sm:py-24">
          <div>
            <Link
              href={homeHref}
              className="text-sm leading-none text-madoo-muted transition hover:text-madoo-text"
            >
              ← Madoo
            </Link>
            <h1 className="mt-6 text-4xl font-semibold leading-none text-madoo-text">
              {content.title}
            </h1>
            <p className="mt-3 text-sm text-madoo-muted">
              {content.lastUpdatedLabel}: {lastUpdated}
            </p>
            <p className="mt-6 text-base leading-7 text-madoo-muted">
              {content.intro}
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {content.sections.map((section) => (
              <div key={section.heading} className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-madoo-text">
                  {section.heading}
                </h2>
                {section.blocks.map((block, i) =>
                  block.kind === "p" ? (
                    <p key={i} className="text-base leading-7 text-madoo-muted">
                      {block.text}
                    </p>
                  ) : (
                    <ul
                      key={i}
                      className="flex list-disc flex-col gap-2 pl-5 text-base leading-7 text-madoo-muted"
                    >
                      {block.items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
