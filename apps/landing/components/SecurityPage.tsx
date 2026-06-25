import {
  LegalDocument,
  type LegalContent,
  type LegalLocale,
} from "./LegalDocument";

const SECURITY_CONTACT = "asponceg@gmail.com";
const LAST_UPDATED = "2026-06-24";

const content: Record<LegalLocale, LegalContent> = {
  en: {
    title: "Security",
    lastUpdatedLabel: "Last updated",
    intro:
      "We take the security of your data seriously. This page explains, in plain language, the measures we use to protect your account and your content, and how to report a security issue.",
    sections: [
      {
        heading: "Encryption",
        blocks: [
          {
            kind: "p",
            text: "All traffic between you and Madoo is encrypted in transit using TLS (HTTPS). Sensitive credentials — such as the access tokens for connected Gmail and Outlook accounts — are encrypted at rest before being stored.",
          },
        ],
      },
      {
        heading: "Authentication",
        blocks: [
          {
            kind: "p",
            text: "You can sign in with Google, GitHub, Apple or an email and password. Passwords are never stored in plain text — we keep only a salted hash. Sessions are protected with secure, signed cookies.",
          },
        ],
      },
      {
        heading: "Connected accounts",
        blocks: [
          {
            kind: "p",
            text: "When you connect an email provider, we request only the permissions needed to send or export your emails. Tokens are encrypted, and you can revoke access at any time from your settings or directly with the provider.",
          },
        ],
      },
      {
        heading: "Payments",
        blocks: [
          {
            kind: "p",
            text: "Payments are processed by Stripe, a PCI‑DSS Level 1 certified provider. Madoo never sees or stores your full card details — we store only the identifiers needed to manage your subscription.",
          },
        ],
      },
      {
        heading: "Infrastructure & access",
        blocks: [
          {
            kind: "p",
            text: "Madoo runs on reputable cloud infrastructure (including Vercel) with isolated environments. Access to production systems and data is limited to authorized personnel on a need‑to‑know basis.",
          },
        ],
      },
      {
        heading: "Data isolation",
        blocks: [
          {
            kind: "p",
            text: "Your content is scoped to your account and workspaces. Requests are authorized so that one account cannot read or modify another account's data.",
          },
        ],
      },
      {
        heading: "Reporting a vulnerability",
        blocks: [
          {
            kind: "p",
            text: `If you believe you have found a security vulnerability, please email ${SECURITY_CONTACT} with the details and steps to reproduce. Do not publicly disclose the issue until we have had a reasonable chance to address it. We appreciate responsible disclosure and will work with you in good faith.`,
          },
        ],
      },
      {
        heading: "Incident response",
        blocks: [
          {
            kind: "p",
            text: "If a security incident affects your data, we will investigate, contain it, and notify affected users as required by applicable law.",
          },
        ],
      },
    ],
  },
  es: {
    title: "Seguridad",
    lastUpdatedLabel: "Última actualización",
    intro:
      "Nos tomamos en serio la seguridad de tus datos. Esta página explica, en lenguaje claro, las medidas que usamos para proteger tu cuenta y tu contenido, y cómo reportar un problema de seguridad.",
    sections: [
      {
        heading: "Cifrado",
        blocks: [
          {
            kind: "p",
            text: "Todo el tráfico entre tú y Madoo se cifra en tránsito mediante TLS (HTTPS). Las credenciales sensibles —como los tokens de acceso de las cuentas conectadas de Gmail y Outlook— se cifran en reposo antes de guardarse.",
          },
        ],
      },
      {
        heading: "Autenticación",
        blocks: [
          {
            kind: "p",
            text: "Puedes iniciar sesión con Google, GitHub, Apple o con email y contraseña. Las contraseñas nunca se guardan en texto plano: solo conservamos un hash con sal. Las sesiones se protegen con cookies seguras y firmadas.",
          },
        ],
      },
      {
        heading: "Cuentas conectadas",
        blocks: [
          {
            kind: "p",
            text: "Cuando conectas un proveedor de email, solicitamos solo los permisos necesarios para enviar o exportar tus emails. Los tokens se cifran y puedes revocar el acceso cuando quieras desde tus ajustes o directamente con el proveedor.",
          },
        ],
      },
      {
        heading: "Pagos",
        blocks: [
          {
            kind: "p",
            text: "Los pagos los procesa Stripe, un proveedor certificado PCI‑DSS Nivel 1. Madoo nunca ve ni guarda los datos completos de tu tarjeta: solo guardamos los identificadores necesarios para gestionar tu suscripción.",
          },
        ],
      },
      {
        heading: "Infraestructura y acceso",
        blocks: [
          {
            kind: "p",
            text: "Madoo funciona sobre infraestructura cloud de confianza (incluido Vercel) con entornos aislados. El acceso a los sistemas y datos de producción se limita al personal autorizado y según la necesidad.",
          },
        ],
      },
      {
        heading: "Aislamiento de datos",
        blocks: [
          {
            kind: "p",
            text: "Tu contenido está vinculado a tu cuenta y tus espacios de trabajo. Las peticiones se autorizan de forma que una cuenta no pueda leer ni modificar los datos de otra.",
          },
        ],
      },
      {
        heading: "Reportar una vulnerabilidad",
        blocks: [
          {
            kind: "p",
            text: `Si crees haber encontrado una vulnerabilidad de seguridad, escribe a ${SECURITY_CONTACT} con los detalles y los pasos para reproducirla. No divulgues públicamente el problema hasta que hayamos tenido una oportunidad razonable de resolverlo. Agradecemos la divulgación responsable y colaboraremos contigo de buena fe.`,
          },
        ],
      },
      {
        heading: "Respuesta a incidentes",
        blocks: [
          {
            kind: "p",
            text: "Si un incidente de seguridad afecta a tus datos, lo investigaremos, lo contendremos y avisaremos a los usuarios afectados según exija la ley aplicable.",
          },
        ],
      },
    ],
  },
};

export function SecurityPage({ locale }: { locale: LegalLocale }) {
  return (
    <LegalDocument
      locale={locale}
      content={content[locale]}
      lastUpdated={LAST_UPDATED}
    />
  );
}
