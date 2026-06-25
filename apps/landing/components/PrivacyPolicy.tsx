import {
  LegalDocument,
  type LegalContent,
  type LegalLocale,
} from "./LegalDocument";

const PRIVACY_CONTACT = "asponceg@gmail.com";
const LAST_UPDATED = "2026-06-24";

const content: Record<LegalLocale, LegalContent> = {
  en: {
    title: "Privacy Policy",
    lastUpdatedLabel: "Last updated",
    intro:
      "This Privacy Policy explains what personal data Madoo (“Madoo”, “we”, “us”) collects when you use our AI email‑template builder, why we collect it, who we share it with, and the rights you have over it. By using Madoo you agree to the practices described here.",
    sections: [
      {
        heading: "1. Data we collect",
        blocks: [
          {
            kind: "p",
            text: "We collect only the data needed to run the product. This falls into the following categories:",
          },
          {
            kind: "ul",
            items: [
              "Account & identity: your email address, display name, profile picture, the locale you use, and your sign‑in method. If you sign in with Google, GitHub or Apple, we store the provider account ID returned by that provider. If you sign up with a password, we store only a salted hash — never the password itself.",
              "Connected email accounts: if you connect Gmail or Outlook, we store encrypted access and refresh tokens and the connected account address so we can send or export emails on your behalf. You can disconnect at any time.",
              "Content you create: the prompts you type, tone/length/audience settings, email titles, generated HTML and code, preview images, chat messages with the AI assistant, images you upload, and any feedback you give.",
              "Billing data: when you subscribe, our payment processor (Stripe) handles your card details. We store only your Stripe customer and subscription identifiers, plan, status and trial dates. We never see or store full card numbers.",
              "Feedback you send us: when you submit feedback from within the app, we store your message together with your account so our team can read it, respond, and improve the product.",
              "Usage & technical data: basic analytics about how the product is used (page views, device/approximate location derived from IP), authentication cookies, login timestamps, and operational logs including AI request metadata (token counts, latency, errors).",
            ],
          },
        ],
      },
      {
        heading: "2. How we use your data",
        blocks: [
          {
            kind: "ul",
            items: [
              "Provide and operate the service — generate, store and export your email templates.",
              "Authenticate you and keep your account secure.",
              "Process payments and manage subscriptions and trials.",
              "Respond to support requests.",
              "Improve and debug the product using aggregated or operational data.",
              "Send essential service emails (we do not send marketing without consent).",
            ],
          },
        ],
      },
      {
        heading: "3. AI processing",
        blocks: [
          {
            kind: "p",
            text: "To generate your emails, the prompts and related content you provide are sent to our AI provider, Anthropic (Claude), acting as a processor on our behalf. We do not sell this content, and we do not use it to train third‑party models beyond what is required to return a result to you.",
          },
        ],
      },
      {
        heading: "4. Who we share data with (sub‑processors)",
        blocks: [
          {
            kind: "p",
            text: "We share data only with service providers that help us run Madoo, under contract and only as needed:",
          },
          {
            kind: "ul",
            items: [
              "Anthropic — AI generation of email content.",
              "Stripe — payment processing.",
              "Google / Microsoft — sign‑in and, if connected, sending email on your behalf.",
              "Vercel — hosting and product analytics.",
              "Our database and infrastructure providers — secure storage of your data.",
            ],
          },
          {
            kind: "p",
            text: "We do not sell your personal data. We may disclose data if required by law or to protect our rights and users.",
          },
        ],
      },
      {
        heading: "5. Data retention",
        blocks: [
          {
            kind: "p",
            text: "We keep your data for as long as your account is active. When you delete your account, we delete or anonymise your personal data within a reasonable period, except where we must retain certain records (for example billing records) to comply with the law.",
          },
        ],
      },
      {
        heading: "6. Your rights",
        blocks: [
          {
            kind: "p",
            text: "Depending on where you live, you may have the right to access, correct, export, restrict or delete your personal data, to object to certain processing, and to withdraw consent. Under the GDPR (EU/EEA/UK) these rights apply to all residents; under the CCPA/CPRA, California residents may also request the categories of data we collect and opt out of any “sale” or “sharing” of personal information — note that we do not sell personal data.",
          },
          {
            kind: "p",
            text: `To exercise any right, email us at ${PRIVACY_CONTACT}. We will respond within the timeframe required by applicable law. You also have the right to complain to your local data protection authority.`,
          },
        ],
      },
      {
        heading: "7. Security",
        blocks: [
          {
            kind: "p",
            text: "We protect your data with encryption in transit, encryption of sensitive tokens at rest, hashed passwords and access controls. No method of transmission or storage is perfectly secure, but we work to protect your information and to notify you of significant incidents as required by law.",
          },
        ],
      },
      {
        heading: "8. International transfers",
        blocks: [
          {
            kind: "p",
            text: "Your data may be processed in countries other than your own, including the United States, where our providers operate. Where required, we rely on appropriate safeguards such as Standard Contractual Clauses.",
          },
        ],
      },
      {
        heading: "9. Children",
        blocks: [
          {
            kind: "p",
            text: "Madoo is not intended for anyone under 16. We do not knowingly collect data from children. If you believe a child has provided us data, contact us and we will delete it.",
          },
        ],
      },
      {
        heading: "10. Changes to this policy",
        blocks: [
          {
            kind: "p",
            text: "We may update this policy from time to time. When we make material changes we will update the “Last updated” date above and, where appropriate, notify you.",
          },
        ],
      },
      {
        heading: "11. Contact",
        blocks: [
          {
            kind: "p",
            text: `Questions about this policy or your data? Email us at ${PRIVACY_CONTACT}.`,
          },
        ],
      },
    ],
  },
  es: {
    title: "Política de Privacidad",
    lastUpdatedLabel: "Última actualización",
    intro:
      "Esta Política de Privacidad explica qué datos personales recopila Madoo (“Madoo”, “nosotros”) cuando usas nuestro creador de plantillas de email con IA, por qué los recopilamos, con quién los compartimos y qué derechos tienes sobre ellos. Al usar Madoo aceptas las prácticas aquí descritas.",
    sections: [
      {
        heading: "1. Datos que recopilamos",
        blocks: [
          {
            kind: "p",
            text: "Solo recopilamos los datos necesarios para que el producto funcione. Se agrupan en las siguientes categorías:",
          },
          {
            kind: "ul",
            items: [
              "Cuenta e identidad: tu correo electrónico, nombre público, foto de perfil, el idioma que usas y tu método de inicio de sesión. Si entras con Google, GitHub o Apple, guardamos el identificador de cuenta que devuelve ese proveedor. Si te registras con contraseña, guardamos solo un hash con sal — nunca la contraseña.",
              "Cuentas de email conectadas: si conectas Gmail u Outlook, guardamos tokens de acceso y de actualización cifrados y la dirección de la cuenta conectada para poder enviar o exportar emails en tu nombre. Puedes desconectarla cuando quieras.",
              "Contenido que creas: los prompts que escribes, los ajustes de tono/longitud/audiencia, títulos de emails, HTML y código generado, imágenes de vista previa, mensajes con el asistente de IA, imágenes que subes y los comentarios que das.",
              "Datos de facturación: al suscribirte, nuestro procesador de pagos (Stripe) gestiona los datos de tu tarjeta. Nosotros solo guardamos tus identificadores de cliente y suscripción de Stripe, el plan, el estado y las fechas de prueba. Nunca vemos ni guardamos el número completo de la tarjeta.",
              "Comentarios que nos envías: cuando envías feedback desde la app, guardamos tu mensaje junto con tu cuenta para que nuestro equipo pueda leerlo, responderte y mejorar el producto.",
              "Datos de uso y técnicos: analíticas básicas de uso (vistas de página, dispositivo/ubicación aproximada derivada de la IP), cookies de autenticación, marcas de tiempo de inicio de sesión y registros operativos, incluidos metadatos de las peticiones de IA (número de tokens, latencia, errores).",
            ],
          },
        ],
      },
      {
        heading: "2. Cómo usamos tus datos",
        blocks: [
          {
            kind: "ul",
            items: [
              "Prestar y operar el servicio: generar, guardar y exportar tus plantillas de email.",
              "Autenticarte y mantener tu cuenta segura.",
              "Procesar pagos y gestionar suscripciones y pruebas.",
              "Responder a tus solicitudes de soporte.",
              "Mejorar y depurar el producto con datos agregados u operativos.",
              "Enviar correos esenciales del servicio (no enviamos marketing sin tu consentimiento).",
            ],
          },
        ],
      },
      {
        heading: "3. Procesamiento con IA",
        blocks: [
          {
            kind: "p",
            text: "Para generar tus emails, los prompts y el contenido relacionado que proporcionas se envían a nuestro proveedor de IA, Anthropic (Claude), que actúa como encargado del tratamiento en nuestro nombre. No vendemos este contenido ni lo usamos para entrenar modelos de terceros más allá de lo necesario para devolverte un resultado.",
          },
        ],
      },
      {
        heading: "4. Con quién compartimos datos (encargados)",
        blocks: [
          {
            kind: "p",
            text: "Solo compartimos datos con proveedores que nos ayudan a operar Madoo, bajo contrato y solo cuando es necesario:",
          },
          {
            kind: "ul",
            items: [
              "Anthropic — generación del contenido de los emails con IA.",
              "Stripe — procesamiento de pagos.",
              "Google / Microsoft — inicio de sesión y, si lo conectas, envío de email en tu nombre.",
              "Vercel — alojamiento y analítica del producto.",
              "Nuestros proveedores de base de datos e infraestructura — almacenamiento seguro de tus datos.",
            ],
          },
          {
            kind: "p",
            text: "No vendemos tus datos personales. Podemos divulgarlos si la ley lo exige o para proteger nuestros derechos y a los usuarios.",
          },
        ],
      },
      {
        heading: "5. Conservación de datos",
        blocks: [
          {
            kind: "p",
            text: "Conservamos tus datos mientras tu cuenta esté activa. Cuando eliminas tu cuenta, borramos o anonimizamos tus datos personales en un plazo razonable, salvo los registros que debamos conservar (por ejemplo, de facturación) para cumplir la ley.",
          },
        ],
      },
      {
        heading: "6. Tus derechos",
        blocks: [
          {
            kind: "p",
            text: "Según dónde vivas, puedes tener derecho a acceder, corregir, exportar, limitar o eliminar tus datos personales, a oponerte a ciertos tratamientos y a retirar tu consentimiento. Bajo el RGPD (UE/EEE/Reino Unido) estos derechos aplican a todos los residentes; bajo la CCPA/CPRA, los residentes de California también pueden solicitar las categorías de datos que recopilamos y oponerse a cualquier “venta” o “compartición” de datos personales — ten en cuenta que no vendemos datos personales.",
          },
          {
            kind: "p",
            text: `Para ejercer cualquier derecho, escríbenos a ${PRIVACY_CONTACT}. Responderemos dentro del plazo que exija la ley aplicable. También tienes derecho a presentar una reclamación ante tu autoridad de protección de datos.`,
          },
        ],
      },
      {
        heading: "7. Seguridad",
        blocks: [
          {
            kind: "p",
            text: "Protegemos tus datos con cifrado en tránsito, cifrado de los tokens sensibles en reposo, contraseñas con hash y controles de acceso. Ningún método de transmisión o almacenamiento es perfectamente seguro, pero trabajamos para proteger tu información y notificarte los incidentes relevantes según exija la ley.",
          },
        ],
      },
      {
        heading: "8. Transferencias internacionales",
        blocks: [
          {
            kind: "p",
            text: "Tus datos pueden tratarse en países distintos al tuyo, incluido Estados Unidos, donde operan nuestros proveedores. Cuando es necesario, nos apoyamos en garantías adecuadas como las Cláusulas Contractuales Tipo.",
          },
        ],
      },
      {
        heading: "9. Menores",
        blocks: [
          {
            kind: "p",
            text: "Madoo no está dirigido a menores de 16 años. No recopilamos datos de menores de forma consciente. Si crees que un menor nos ha facilitado datos, contáctanos y los eliminaremos.",
          },
        ],
      },
      {
        heading: "10. Cambios en esta política",
        blocks: [
          {
            kind: "p",
            text: "Podemos actualizar esta política de vez en cuando. Cuando hagamos cambios importantes actualizaremos la fecha de “Última actualización” de arriba y, cuando proceda, te avisaremos.",
          },
        ],
      },
      {
        heading: "11. Contacto",
        blocks: [
          {
            kind: "p",
            text: `¿Preguntas sobre esta política o tus datos? Escríbenos a ${PRIVACY_CONTACT}.`,
          },
        ],
      },
    ],
  },
};

export function PrivacyPolicy({ locale }: { locale: LegalLocale }) {
  return (
    <LegalDocument
      locale={locale}
      content={content[locale]}
      lastUpdated={LAST_UPDATED}
    />
  );
}
