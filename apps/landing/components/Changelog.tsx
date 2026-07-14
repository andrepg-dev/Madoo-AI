import Link from "next/link";
import { LandingHeader } from "./LandingHeader";
import { legalHeaderCopy, type LegalLocale } from "./LegalDocument";

export type ChangelogChange = {
  title: string;
  body: string;
};

export type ChangelogEntry = {
  date: string;
  version?: string;
  changes: ChangelogChange[];
};

export type ChangelogContent = {
  title: string;
  intro: string;
  entries: ChangelogEntry[];
};

/**
 * Customer-facing product updates. Written for people who use Madoo, not for
 * engineers — each change says what it does for them, not how it was built.
 */
export const changelogContent: Record<LegalLocale, ChangelogContent> = {
  en: {
    title: "What's new",
    intro:
      "The latest improvements to Madoo — new ways to edit, test, and share your email templates.",
    entries: [
      {
        date: "July 14, 2026",
        changes: [
          {
            title: "Click any text to edit it",
            body: "Double-click text right in the email preview to change it on the spot — no side panels. It even works on text that mixes your words with dynamic fields like a name or discount.",
          },
          {
            title: "Your uploaded images stay put",
            body: "When you upload your own image and then ask the AI for another change, your image no longer gets wiped out. Your work sticks.",
          },
          {
            title: "See how a template lands in a real inbox",
            body: "From any template page you can send yourself a live copy and check how it renders in Gmail, Outlook, or Apple Mail. Madoo remembers your email so you don't retype it.",
          },
        ],
      },
      {
        date: "July 10, 2026",
        changes: [
          {
            title: "Send test emails from your dashboard",
            body: "Every template card now has a quick “Test email” action so you can drop a copy in your inbox before you send it for real.",
          },
          {
            title: "Every template, always visible",
            body: "Your dashboard now shows all of your templates instead of only the most recent ones.",
          },
          {
            title: "Shared links look sharp",
            body: "When you share an email link, it now unfurls with a preview image of the template — so people see the design before they click.",
          },
        ],
      },
      {
        date: "July 6, 2026",
        changes: [
          {
            title: "A cleaner template gallery",
            body: "The homepage showcase now uses clean, uniform tiles so it's easier to scan and find a starting point.",
          },
        ],
      },
    ],
  },
  es: {
    title: "Novedades",
    intro:
      "Las últimas mejoras de Madoo — nuevas formas de editar, probar y compartir tus plantillas de email.",
    entries: [
      {
        date: "14 de julio de 2026",
        changes: [
          {
            title: "Haz clic en cualquier texto para editarlo",
            body: "Haz doble clic en el texto directamente en la vista previa del email para cambiarlo al instante, sin paneles laterales. Funciona incluso en texto que mezcla tus palabras con campos dinámicos como un nombre o un descuento.",
          },
          {
            title: "Tus imágenes subidas se quedan",
            body: "Cuando subes tu propia imagen y luego le pides otro cambio a la IA, tu imagen ya no se borra. Tu trabajo se mantiene.",
          },
          {
            title: "Mira cómo se ve una plantilla en un buzón real",
            body: "Desde cualquier página de plantilla puedes enviarte una copia real y comprobar cómo se ve en Gmail, Outlook o Apple Mail. Madoo recuerda tu email para que no lo escribas cada vez.",
          },
        ],
      },
      {
        date: "10 de julio de 2026",
        changes: [
          {
            title: "Envía emails de prueba desde tu panel",
            body: "Cada plantilla ahora tiene una acción rápida de “Email de prueba” para dejar una copia en tu buzón antes de enviarla de verdad.",
          },
          {
            title: "Todas tus plantillas, siempre visibles",
            body: "Tu panel ahora muestra todas tus plantillas, no solo las más recientes.",
          },
          {
            title: "Los enlaces compartidos lucen bien",
            body: "Cuando compartes el enlace de un email, ahora muestra una imagen de vista previa de la plantilla — así ven el diseño antes de hacer clic.",
          },
        ],
      },
      {
        date: "6 de julio de 2026",
        changes: [
          {
            title: "Una galería de plantillas más limpia",
            body: "La galería de la página principal ahora usa mosaicos limpios y uniformes para que sea más fácil explorar y encontrar un punto de partida.",
          },
        ],
      },
    ],
  },
};

export function Changelog({ locale }: { locale: LegalLocale }) {
  const content = changelogContent[locale];
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
            <p className="mt-6 text-base leading-7 text-madoo-muted">
              {content.intro}
            </p>
          </div>

          <div className="flex flex-col gap-12">
            {content.entries.map((entry) => (
              <div
                key={entry.date}
                className="flex flex-col gap-5 border-t border-madoo-text/10 pt-8 first:border-t-0 first:pt-0 sm:flex-row sm:gap-10"
              >
                <div className="shrink-0 sm:w-40 sm:pt-1">
                  <span className="text-sm font-medium text-madoo-muted">
                    {entry.date}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-6">
                  {entry.changes.map((change) => (
                    <div key={change.title} className="flex flex-col gap-2">
                      <h2 className="text-lg font-semibold text-madoo-text">
                        {change.title}
                      </h2>
                      <p className="text-base leading-7 text-madoo-muted">
                        {change.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
