import {
  LegalDocument,
  type LegalContent,
  type LegalLocale,
} from "./LegalDocument";

const TERMS_CONTACT = "asponceg@gmail.com";
const LAST_UPDATED = "2026-06-24";

const content: Record<LegalLocale, LegalContent> = {
  en: {
    title: "Terms of Service",
    lastUpdatedLabel: "Last updated",
    intro:
      "These Terms of Service (“Terms”) govern your access to and use of Madoo (“Madoo”, “we”, “us”), an AI email‑template builder. By creating an account or using the service you agree to these Terms. If you do not agree, do not use Madoo.",
    sections: [
      {
        heading: "1. The service",
        blocks: [
          {
            kind: "p",
            text: "Madoo lets you generate, edit, store and export email templates with the help of AI. We may add, change or remove features at any time.",
          },
        ],
      },
      {
        heading: "2. Your account",
        blocks: [
          {
            kind: "p",
            text: "You must provide accurate information and keep your credentials secure. You are responsible for all activity under your account. You must be at least 16 years old to use Madoo.",
          },
        ],
      },
      {
        heading: "3. Acceptable use",
        blocks: [
          { kind: "p", text: "You agree not to:" },
          {
            kind: "ul",
            items: [
              "Use Madoo to create or send spam, phishing, malware or other unlawful, deceptive or harmful content.",
              "Violate any law or the rights of others, including intellectual property and privacy rights.",
              "Attempt to break, overload, reverse‑engineer or gain unauthorized access to the service.",
              "Resell or abuse the AI generation features (for example, automated bulk requests outside your plan).",
            ],
          },
          {
            kind: "p",
            text: "When you send email through a connected provider (Gmail/Outlook), you are responsible for complying with that provider's policies and anti‑spam laws (such as CAN‑SPAM and GDPR consent rules).",
          },
        ],
      },
      {
        heading: "4. Your content & ownership",
        blocks: [
          {
            kind: "p",
            text: "You own the content you create with Madoo (prompts, emails, templates). You grant us a limited licence to host, process and display that content solely to operate and improve the service, including sending it to our AI provider to generate results for you.",
          },
        ],
      },
      {
        heading: "5. AI‑generated content",
        blocks: [
          {
            kind: "p",
            text: "AI output can be inaccurate, generic, or similar to output given to others. You are responsible for reviewing generated content before you use or send it. We make no guarantee that AI output is original, error‑free or fit for a particular purpose.",
          },
        ],
      },
      {
        heading: "6. Plans, billing & trials",
        blocks: [
          {
            kind: "ul",
            items: [
              "Paid plans and AI credits are billed through our payment processor, Stripe. By subscribing you authorize recurring charges until you cancel.",
              "Free trials, where offered, convert to a paid plan unless cancelled before the trial ends.",
              "You can cancel any time from your billing settings; access continues until the end of the current paid period.",
              "Except where required by law, payments are non‑refundable.",
              "We may change prices with reasonable notice; changes apply to the next billing cycle.",
            ],
          },
        ],
      },
      {
        heading: "7. Third‑party services",
        blocks: [
          {
            kind: "p",
            text: "Madoo relies on third parties (Anthropic, Stripe, Google, Microsoft, Vercel and others). Your use of connected services is also subject to their terms. We are not responsible for third‑party services we do not control.",
          },
        ],
      },
      {
        heading: "8. Intellectual property",
        blocks: [
          {
            kind: "p",
            text: "Madoo, including its software, branding and design, is owned by us and protected by law. These Terms do not grant you any rights to our trademarks or to redistribute the service itself.",
          },
        ],
      },
      {
        heading: "9. Termination",
        blocks: [
          {
            kind: "p",
            text: "You may stop using Madoo and delete your account at any time. We may suspend or terminate your access if you breach these Terms or use the service in a way that creates risk or legal exposure. On termination, your right to use the service ends; sections that by their nature should survive (such as ownership, disclaimers and liability) will survive.",
          },
        ],
      },
      {
        heading: "10. Disclaimers",
        blocks: [
          {
            kind: "p",
            text: 'The service is provided "as is" and "as available", without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose and non‑infringement. We do not warrant that the service will be uninterrupted, secure or error‑free.',
          },
        ],
      },
      {
        heading: "11. Limitation of liability",
        blocks: [
          {
            kind: "p",
            text: "To the maximum extent permitted by law, Madoo will not be liable for any indirect, incidental, special or consequential damages, or loss of data, revenue or profits. Our total liability for any claim relating to the service is limited to the amount you paid us in the 12 months before the claim.",
          },
        ],
      },
      {
        heading: "12. Changes to these Terms",
        blocks: [
          {
            kind: "p",
            text: "We may update these Terms from time to time. Material changes will be reflected in the “Last updated” date above. Continued use after changes means you accept the updated Terms.",
          },
        ],
      },
      {
        heading: "13. Governing law",
        blocks: [
          {
            kind: "p",
            text: "These Terms are governed by the laws applicable at our principal place of business, without regard to conflict‑of‑law rules. Nothing here removes mandatory consumer protections you may have where you live.",
          },
        ],
      },
      {
        heading: "14. Contact",
        blocks: [
          {
            kind: "p",
            text: `Questions about these Terms? Email us at ${TERMS_CONTACT}.`,
          },
        ],
      },
    ],
  },
  es: {
    title: "Términos del Servicio",
    lastUpdatedLabel: "Última actualización",
    intro:
      "Estos Términos del Servicio (“Términos”) regulan tu acceso y uso de Madoo (“Madoo”, “nosotros”), un creador de plantillas de email con IA. Al crear una cuenta o usar el servicio aceptas estos Términos. Si no estás de acuerdo, no uses Madoo.",
    sections: [
      {
        heading: "1. El servicio",
        blocks: [
          {
            kind: "p",
            text: "Madoo te permite generar, editar, guardar y exportar plantillas de email con ayuda de IA. Podemos añadir, cambiar o eliminar funciones en cualquier momento.",
          },
        ],
      },
      {
        heading: "2. Tu cuenta",
        blocks: [
          {
            kind: "p",
            text: "Debes facilitar información veraz y mantener seguras tus credenciales. Eres responsable de toda la actividad de tu cuenta. Debes tener al menos 16 años para usar Madoo.",
          },
        ],
      },
      {
        heading: "3. Uso aceptable",
        blocks: [
          { kind: "p", text: "Te comprometes a no:" },
          {
            kind: "ul",
            items: [
              "Usar Madoo para crear o enviar spam, phishing, malware u otro contenido ilícito, engañoso o dañino.",
              "Infringir la ley o los derechos de terceros, incluidos los de propiedad intelectual y privacidad.",
              "Intentar romper, sobrecargar, hacer ingeniería inversa o acceder sin autorización al servicio.",
              "Revender o abusar de las funciones de IA (por ejemplo, peticiones masivas automatizadas fuera de tu plan).",
            ],
          },
          {
            kind: "p",
            text: "Cuando envías email a través de un proveedor conectado (Gmail/Outlook), eres responsable de cumplir las políticas de ese proveedor y las leyes anti‑spam (como CAN‑SPAM y las reglas de consentimiento del RGPD).",
          },
        ],
      },
      {
        heading: "4. Tu contenido y propiedad",
        blocks: [
          {
            kind: "p",
            text: "Eres dueño del contenido que creas con Madoo (prompts, emails, plantillas). Nos concedes una licencia limitada para alojar, procesar y mostrar ese contenido únicamente para operar y mejorar el servicio, incluido enviarlo a nuestro proveedor de IA para generar resultados para ti.",
          },
        ],
      },
      {
        heading: "5. Contenido generado por IA",
        blocks: [
          {
            kind: "p",
            text: "El resultado de la IA puede ser inexacto, genérico o similar al de otros usuarios. Eres responsable de revisar el contenido generado antes de usarlo o enviarlo. No garantizamos que el resultado de la IA sea original, esté libre de errores ni sea apto para un fin concreto.",
          },
        ],
      },
      {
        heading: "6. Planes, facturación y pruebas",
        blocks: [
          {
            kind: "ul",
            items: [
              "Los planes de pago y los créditos de IA se facturan a través de nuestro procesador de pagos, Stripe. Al suscribirte autorizas cargos recurrentes hasta que canceles.",
              "Las pruebas gratuitas, cuando se ofrezcan, se convierten en plan de pago salvo que canceles antes de que termine la prueba.",
              "Puedes cancelar cuando quieras desde tus ajustes de facturación; el acceso continúa hasta el final del periodo pagado en curso.",
              "Salvo que la ley exija lo contrario, los pagos no son reembolsables.",
              "Podemos cambiar precios con aviso razonable; los cambios aplican al siguiente ciclo de facturación.",
            ],
          },
        ],
      },
      {
        heading: "7. Servicios de terceros",
        blocks: [
          {
            kind: "p",
            text: "Madoo depende de terceros (Anthropic, Stripe, Google, Microsoft, Vercel y otros). Tu uso de los servicios conectados también está sujeto a sus términos. No somos responsables de servicios de terceros que no controlamos.",
          },
        ],
      },
      {
        heading: "8. Propiedad intelectual",
        blocks: [
          {
            kind: "p",
            text: "Madoo, incluido su software, marca y diseño, es de nuestra propiedad y está protegido por la ley. Estos Términos no te otorgan derechos sobre nuestras marcas ni para redistribuir el servicio en sí.",
          },
        ],
      },
      {
        heading: "9. Terminación",
        blocks: [
          {
            kind: "p",
            text: "Puedes dejar de usar Madoo y eliminar tu cuenta cuando quieras. Podemos suspender o cancelar tu acceso si incumples estos Términos o usas el servicio de forma que cree riesgo o exposición legal. Al terminar, tu derecho de uso finaliza; las secciones que por su naturaleza deban subsistir (como propiedad, exenciones y responsabilidad) seguirán vigentes.",
          },
        ],
      },
      {
        heading: "10. Exenciones",
        blocks: [
          {
            kind: "p",
            text: 'El servicio se presta "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o implícitas, incluidas las de comerciabilidad, idoneidad para un fin concreto y no infracción. No garantizamos que el servicio sea ininterrumpido, seguro o libre de errores.',
          },
        ],
      },
      {
        heading: "11. Limitación de responsabilidad",
        blocks: [
          {
            kind: "p",
            text: "En la máxima medida permitida por la ley, Madoo no será responsable de daños indirectos, incidentales, especiales o consecuentes, ni de la pérdida de datos, ingresos o beneficios. Nuestra responsabilidad total por cualquier reclamación relacionada con el servicio se limita al importe que nos pagaste en los 12 meses anteriores a la reclamación.",
          },
        ],
      },
      {
        heading: "12. Cambios en estos Términos",
        blocks: [
          {
            kind: "p",
            text: "Podemos actualizar estos Términos de vez en cuando. Los cambios importantes se reflejarán en la fecha de “Última actualización” de arriba. El uso continuado tras los cambios implica que aceptas los Términos actualizados.",
          },
        ],
      },
      {
        heading: "13. Ley aplicable",
        blocks: [
          {
            kind: "p",
            text: "Estos Términos se rigen por las leyes aplicables en nuestro principal lugar de actividad, sin atender a las normas de conflicto de leyes. Nada de lo aquí dispuesto elimina las protecciones obligatorias al consumidor que puedas tener donde resides.",
          },
        ],
      },
      {
        heading: "14. Contacto",
        blocks: [
          {
            kind: "p",
            text: `¿Preguntas sobre estos Términos? Escríbenos a ${TERMS_CONTACT}.`,
          },
        ],
      },
    ],
  },
};

export function TermsOfService({ locale }: { locale: LegalLocale }) {
  return (
    <LegalDocument
      locale={locale}
      content={content[locale]}
      lastUpdated={LAST_UPDATED}
    />
  );
}
