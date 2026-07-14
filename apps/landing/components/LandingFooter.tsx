"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type FooterLocale = "en" | "es";

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const footerContent: Array<{
  locale: FooterLocale;
  columns: FooterColumn[];
}> = [
    {
      locale: "en",
      columns: [
        {
          title: "Company",
          links: [
            { label: "About", href: "/" },
            { label: "Security", href: "/security" },
            { label: "Trust center", href: "/" },
          ],
        },
        {
          title: "Product",
          links: [
            { label: "Pricing", href: "/pricing" },
            { label: "Templates", href: "/templates" },
            { label: "Email editor", href: "/" },
            { label: "AI generator", href: "/" },
            { label: "Export", href: "/" },
            { label: "Changelog", href: "/changelog" },
            { label: "Status", href: "/" },
          ],
        },
        {
          title: "Resources",
          links: [
            { label: "Learn", href: "/" },
            { label: "Guides", href: "/" },
            { label: "Blog", href: "/" },
            { label: "Reviews", href: "/" },
            { label: "Sitemap", href: "/sitemap.xml" },
          ],
        },
        {
          title: "Legal",
          links: [
            { label: "Privacy policy", href: "/privacy" },
            { label: "Cookie settings", href: "/" },
            { label: "Terms", href: "/terms" },
            { label: "Report security concerns", href: "/security" },
          ],
        },
        {
          title: "Community",
          links: [
            { label: "Discord", href: "https://discord.gg/5NQarNVRNA" },
            { label: "X / Twitter", href: "https://x.com/madooai" },
            { label: "LinkedIn", href: "https://linkedin.com/company/madooai" },
            { label: "YouTube", href: "https://www.youtube.com/@madooai" },
          ],
        },
      ],
    },
    {
      locale: "es",
      columns: [
        {
          title: "Compañía",
          links: [
            { label: "Acerca de", href: "/es" },
            { label: "Seguridad", href: "/es/security" },
            { label: "Centro de confianza", href: "/es" },
          ],
        },
        {
          title: "Producto",
          links: [
            { label: "Precios", href: "/pricing" },
            { label: "Plantillas", href: "/templates" },
            { label: "Editor de emails", href: "/es" },
            { label: "Generador IA", href: "/es" },
            { label: "Exportar", href: "/es" },
            { label: "Cambios", href: "/es/changelog" },
            { label: "Estado", href: "/es" },
          ],
        },
        {
          title: "Recursos",
          links: [
            { label: "Aprender", href: "/es" },
            { label: "Guías", href: "/es" },
            { label: "Blog", href: "/es" },
            { label: "Reseñas", href: "/es" },
            { label: "Sitemap", href: "/sitemap.xml" },
          ],
        },
        {
          title: "Legal",
          links: [
            { label: "Privacidad", href: "/es/privacy" },
            { label: "Cookies", href: "/es" },
            { label: "Términos", href: "/es/terms" },
            { label: "Reportar seguridad", href: "/es/security" },
          ],
        },
        {
          title: "Comunidad",
          links: [
            { label: "Discord", href: "https://discord.gg/5NQarNVRNA" },
            { label: "X / Twitter", href: "https://x.com/madooai" },
            { label: "LinkedIn", href: "https://linkedin.com/company/madooai" },
            { label: "YouTube", href: "https://www.youtube.com/@madooai" },
          ],
        },
      ],
    },
  ];

const languageLinks: Array<{ label: string; locale: FooterLocale; href: string }> = [
  { label: "EN", locale: "en", href: "/en" },
  { label: "ES", locale: "es", href: "/es" },
];

function getFooterLocale(pathname: string | null): FooterLocale {
  return pathname?.split("/")[1] === "es" ? "es" : "en";
}

export function LandingFooter() {
  const pathname = usePathname();
  const locale = getFooterLocale(pathname);
  const footer = footerContent.find((item) => item.locale === locale) ?? footerContent[0]!;

  return (
    <footer className="relative z-10 px-4 pb-10 sm:px-8">
      <div className="madoo-paper-border relative z-10 mx-auto grid w-full max-w-7xl gap-12 rounded-[28px] bg-white px-8 py-12 font-ibm-plex-sans text-[#1f1d1a] md:grid-cols-[1fr_4fr] md:px-12 md:py-14">
        <div className="flex flex-col justify-between gap-10">
          <Link className="flex w-fit cursor-pointer items-center gap-2.5" href="/" aria-label="Madoo AI home">
            <img src="/madoo-transparent.png" alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
            <span className="text-sm font-semibold text-[#2b3037]">Madoo AI</span>
          </Link>

          <div className="flex items-center gap-2 text-sm text-[#696762]">
            <span aria-hidden="true">◎</span>
            {languageLinks.map((link, index) => (
              <span key={link.locale} className="contents">
                {index > 0 ? <span aria-hidden="true">/</span> : null}
                <Link
                  className={`transition hover:text-[#5b63ff] ${locale === link.locale ? "font-semibold text-[#1f1d1a]" : ""
                    }`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-5">
          {footer.columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-5 text-sm font-medium text-[#6b6963]">{column.title}</h3>
              <ul className="space-y-3.5">
                {column.links.map((link) => {
                  const external = link.href.startsWith("http");
                  return (
                    <li key={link.label}>
                      <Link
                        className="text-sm text-[#24221f] transition hover:text-[#5b63ff]"
                        href={link.href}
                        {...(external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
