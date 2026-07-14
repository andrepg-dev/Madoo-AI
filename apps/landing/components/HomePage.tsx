"use client";

import {
  clientHomeUrl,
  clientPromptUrl,
  clientUseTemplateUrl,
  isLikelySignedIn,
} from "@/lib/client-app";
import type { LandingCommunityTemplate } from "@/lib/community-templates";
import { uploadPromptImages } from "@/lib/upload-prompt-image";
import { useDictation } from "@/lib/use-dictation";
import {
  AiMagicIcon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  ComputerIcon,
  DashboardSquare01Icon,
  Download04Icon,
  FlashIcon,
  MailValidation01Icon,
  Mic02Icon,
  PaintBoardIcon,
  Share08Icon,
  SourceCodeSquareIcon,
  TestTube01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cx } from "@madoo/design-system";
import type { VariableSchemaRoot } from "@madoo/shared";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import AuthDialog from "./AuthDialog";
import {
  AttachmentPreviewList,
  AttachMenu,
  type PromptAttachment,
} from "./home/AttachMenu";
import { Hi, getNextSearchParams } from "./home/home-utils";
import {
  TemplatePreviewImage,
  TemplateShowcaseImage,
  pickCategoryShowcase,
  useTallTemplates,
} from "./home/TemplatePreviewImage";
import { useTypingPlaceholder } from "./home/useTypingPlaceholder";
import { LandingHeader } from "./LandingHeader";
import TemplatePreviewDialog, {
  type TemplatePreviewData,
} from "./TemplatePreviewDialog";

const exportProviders = [
  {
    name: "Mailchimp",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailchimp.com&sz=64",
  },
  {
    name: "Klaviyo",
    iconSrc: "https://www.google.com/s2/favicons?domain=klaviyo.com&sz=64",
  },
  {
    name: "HubSpot",
    iconSrc: "https://www.google.com/s2/favicons?domain=hubspot.com&sz=64",
  },
  {
    name: "Brevo",
    iconSrc: "https://www.google.com/s2/favicons?domain=brevo.com&sz=64",
  },
  {
    name: "MailerLite",
    iconSrc: "https://www.google.com/s2/favicons?domain=mailerlite.com&sz=64",
  },
  {
    name: "ConvertKit",
    iconSrc: "https://www.google.com/s2/favicons?domain=convertkit.com&sz=64",
  },
  {
    name: "ActiveCampaign",
    iconSrc:
      "https://www.google.com/s2/favicons?domain=activecampaign.com&sz=64",
  },
  {
    name: "Customer.io",
    iconSrc: "https://www.google.com/s2/favicons?domain=customer.io&sz=64",
  },
  {
    name: "Braze",
    iconSrc: "https://www.google.com/s2/favicons?domain=braze.com&sz=64",
  },
  {
    name: "Marketo",
    iconSrc: "https://www.google.com/s2/favicons?domain=marketo.com&sz=64",
  },
  {
    name: "Salesforce",
    iconSrc: "https://www.google.com/s2/favicons?domain=salesforce.com&sz=64",
  },
];

const movingExportProviders = Array.from(
  { length: 4 },
  () => exportProviders,
).flat();

const providerLogoSwatches = [
  "#f2e8ff",
  "#e7f0ff",
  "#e8fbff",
  "#f7ecff",
  "#eaf8ef",
  "#fff0e6",
];

const templateCards = [
  {
    name: "Big news: We've been backed by Y Combinator 🚀",
    description: "Bold startup funding announcement.",
    date: "5/25/2026, 3:46:32 PM",
    imageSrc: "/templates/ycombinator.png",
  },
  {
    name: "Tu próximo hogar está a un clic — Hopta",
    description: "Clean real estate offer in Spanish.",
    imageSrc: "/templates/hopta-preview.png",
  },
  {
    name: "40% off everything — no exceptions",
    description: "High-contrast Black Friday promo.",
    imageSrc: "/templates/black-friday.png",
  },
  {
    name: "Beautiful emails, built in seconds — Madoo AI",
    description: "Editorial product update layout.",
    imageSrc: "/templates/news-letter-2.png",
  },
  {
    name: "We're officially backed by Y Combinator — here's what's next",
    description: "Investor-backed milestone note.",
    imageSrc: "/templates/black-friday-2.png",
  },
  {
    name: "We just shipped something big 🚀",
    description: "Dark invite-style product launch.",
    imageSrc: "/templates/letter.png",
  },
  {
    name: "Big ideas. Short sentences. Zero fluff.",
    description: "Minimal long-form newsletter.",
    date: "5/15/2026, 10:24:02 AM",
    imageSrc: "/templates/news-letter.png",
  },
];

// Tile heights (height / width) used before the preview image loads so the
// showcase stays lively while screenshots stream in.
const templateDefaultHeightRatios = [1.25, 1.4, 1.33, 1.43, 1.5] as const;

type Locale = "en" | "es";

type HomePageProps = {
  locale?: Locale;
  communityTemplates?: LandingCommunityTemplate[];
};

type TemplateShowcaseCard = {
  id?: string;
  name: string;
  description: string;
  imageSrc?: string;
  isCreateCard?: boolean;
  isCommunityTemplate?: boolean;
  authorName?: string | null;
  category?: string | null;
  variableCount?: number;
  variables?: VariableSchemaRoot["variables"];
};

export const TEMPLATE_ROLE_LABELS: Record<string, string> = {
  text: "Text",
  url: "URL",
  image: "Image",
  date: "Date",
};

// Icons for the product-feature tabs, paired to each tab's two blocks (same
// order as `productFeatures.tabs` in localeCopy).
const featureTabIcons = [
  [AiMagicIcon, PaintBoardIcon],
  [Download04Icon, SourceCodeSquareIcon],
  [FlashIcon, DashboardSquare01Icon],
  [MailValidation01Icon, ComputerIcon, TestTube01Icon],
  [UserAdd01Icon, CheckmarkBadge01Icon, Share08Icon],
] as const;

const featureTabImages = [
  {
    src: "/product/design-your-way-hero.webp",
    alt: "Paper-cutout illustration of email building blocks snapping together into a finished template",
  },
  {
    src: "/integrations-export.png",
    alt: "HTML export connected to Mailchimp, Klaviyo, Zapier, SendGrid, Outlook, and upload anywhere",
  },
  {
    src: "/product/time-saving-hero.webp",
    alt: "Paper-cutout illustration of a one-line prompt turning into a finished email landing in an inbox tray, with a stopwatch above",
  },
  {
    src: "/product/test-email-engine-hero.webp",
    alt: "Paper-cutout illustration of one email verified with checkmarks across desktop, tablet, and phone",
  },
  {
    src: "/product/team-collaboration.png",
    alt: "Teammates collaborating in a shared Madoo workspace",
  },
] as const;

export const localeCopy = {
  en: {
    nav: {
      useCases: "Use cases",
      community: "Community",
      emailTemplates: "Email Templates",
      pricing: "Pricing",
      login: "Login",
      getStarted: "Get started",
      goToApp: "Open app",
      mobileMenu: "Open navigation",
    },
    hero: {
      titleStart: "AI Email Builder",
      titleAccent: "",
      subtitle: "Design your email template with AI",
      placeholderPrefix: "Hi Madoo, ",
      placeholders: [
        "create an email template for my AWS Summit event. Use this link for details: link.com",
        "turn this product update into a short newsletter for our subscribers.",
        "make a campaign email for our new feature launch. Target active users and drive trials.",
        "create a marketer-ready promo email for a limited offer with a clear CTA.",
      ],
      submit: "Generate email",
      explore: "Explore template examples",
      exportLabel: "Export to any provider of your choice",
      addAttachment: "Add attachment",
      microphone: "Use microphone",
    },
    workflow: {
      title: "Prompt. Design. Export.",
      description:
        "Go from rough idea to production-ready email without blank-page work or repeated layout rebuilds.",
      steps: [
        {
          label: "Prompt",
          text: "Describe the audience, offer, tone, and goal.",
        },
        {
          label: "Design",
          text: "Madoo turns it into a polished email layout.",
        },
        {
          label: "Export",
          text: "Send production-ready HTML to your email tool.",
        },
      ],
    },
    value: {
      eyebrow: "Built for modern email operations",
      title: "Create AI-assisted email templates",
      description:
        "Start with a prompt, turn it into a branded email template, review every production detail, and export it to the tool your team already uses.",
      status: "AI-assisted template creation",
      aiTitle: "AI-assisted templates",
      aiDescription:
        "Create campaign-ready email templates from plain-language prompts, then refine copy, sections, tone, and layout.",
      compatibilityTitle: "Client compatibility",
      compatibilityDescription:
        "Review your email layout, copy, structure, and responsive presentation before export.",
      brandTitle: "Add your brand kit",
      brandDescription:
        "Upload your logo, colors, and fonts — Madoo generates on-brand emails every time.",
      workflowTitle: "Team workflow",
      workflowDescription:
        "Approvals, reviews, ownership, and campaign handoff stay visible before export.",
      integrationsTitle: "ESP integrations",
      integrationsDescription:
        "Move finished campaigns into Mailchimp, HubSpot, Klaviyo, Salesforce, and other ESPs.",
      qaTitle: "Test email engine",
      qaDescription:
        "Send test emails from Madoo to review the final message before you move it into your email tool.",
      clients: ["Desktop", "Mobile", "Copy", "Layout", "Export"],
      flow: ["Draft", "Review", "Approved", "Export"],
      controls: ["Copy", "Layout", "Brand", "Audience", "Compliance", "Export"],
      previewLabel: "preview",
      readyLabel: "Ready",
    },
    productFeatures: {
      cta: "See examples",
      tabs: [
        {
          label: "Designs & Layouts",
          title: "Design emails your way",
          blocks: [
            {
              heading: "AI EMAIL BUILDER",
              body: (
                <>
                  Tell Madoo who it's for and what you're selling. You get a
                  full email layout that fits your brand. No blank page,{" "}
                  <span className="font-semibold text-[#171717] underline decoration-[#8b5cf6] decoration-2 underline-offset-4">
                    no building sections by hand.
                  </span>
                </>
              ),
            },
            {
              heading: "ADD YOUR BRAND KIT",
              body: "Upload your logo, colors, and fonts, and Madoo generates on-brand emails every time. Refine copy, sections, and layout until it's exactly right.",
            },
          ],
        },
        {
          label: "Integrations & Export",
          title: "Ship to any email provider",
          blocks: [
            {
              heading: "ONE-CLICK EXPORT",
              body: (
                <>
                  Send <Hi color="#5b63ff">production-ready HTML</Hi> straight to
                  Mailchimp, Klaviyo, HubSpot, Salesforce, and the other ESPs your
                  team already uses.
                </>
              ),
            },
            {
              heading: "CLEAN, PORTABLE HTML",
              body: "Every email exports as standards-based HTML that renders the same wherever you paste it — no lock-in, no rework.",
            },
          ],
        },
        {
          label: "Time Saving & Automation",
          title: "From idea to inbox in minutes",
          blocks: [
            {
              heading: "PROMPT TO EMAIL",
              body: (
                <>
                  Go from a one-line prompt to a finished campaign{" "}
                  <Hi color="#d97706">in seconds</Hi>. Iterate with AI instead of
                  rebuilding layouts by hand.
                </>
              ),
            },
            {
              heading: "START FROM TEMPLATES",
              body: "Begin with community-tested templates and let AI adapt the copy, tone, and audience to your campaign.",
            },
          ],
        },
        {
          label: "Test Email Engine",
          title: "Test email engine",
          blocks: [
            {
              heading: "VERIFY GENERATED HTML",
              body: (
                <>
                  Sends real test emails and checks the{" "}
                  <Hi color="#0d9488">generated HTML is valid</Hi> before you ship.
                </>
              ),
            },
            {
              heading: "SPAM, LINKS & ACCESSIBILITY",
              body: "Built-in checks for spam risk, broken links, and accessibility.",
            },
            {
              heading: "EMAIL REVIEW",
              body: "Review layout, copy, sections, and responsive design before you export.",
            },
          ],
        },
        {
          label: "Share & Collaboration",
          title: "Move campaigns as a team",
          blocks: [
            {
              heading: "INVITE WITH ROLES",
              body: "Invite teammates as admins or members and control what they can access in your workspace.",
            },
            {
              heading: "REVIEWS & APPROVALS",
              body: (
                <>
                  Drafts, reviews, ownership, and approvals stay visible so
                  campaigns move from idea to launch{" "}
                  <Hi color="#0d9488">without confusion</Hi>.
                </>
              ),
            },
            {
              heading: "SHARED WORKSPACE",
              body: "Share templates across your workspace and hand off finished campaigns cleanly before export.",
            },
          ],
        },
      ],
    },
    templates: {
      title: "Emails from a single prompt",
      description:
        "Start from community-tested templates, then refine copy and layout with AI.",
      browseAll: "Browse all templates",
      galleryTitle: "Email Templates",
      galleryDescription:
        "Free, ready-to-use email templates for every campaign and occasion. Pick one, then make it yours with AI.",
      all: "All",
      searchPlaceholder: "Search templates",
      empty: "No templates in this category yet.",
      previewAlt: "email template preview",
      hover: "Template Details",
      by: "By",
      variables: "variables",
      noVariables: "No variables.",
      use: "Use template",
      using: "Opening…",
      close: "Close",
      communityFallbackDescription: "Community template.",
      detailBack: "All templates",
      preview: "Live preview",
      viewDesktop: "Desktop view",
      viewMobile: "Mobile view",
      schemeLight: "Light mode",
      schemeDark: "Dark mode",
      aiGenerated: "AI-generated",
      compatibilityTitle: "See it in your inbox",
      compatibilityPlaceholder: "you@company.com",
      compatibilityCta: "Test compatibility",
      compatibilitySending: "Sending…",
      compatibilitySent: "Sent! Check your inbox to see how it renders.",
      compatibilityError: "Could not send the test. Try again.",
      compatibilityInvalidEmail: "Enter a valid email.",
      compatibilityLimit: "Daily limit reached — 3 test emails a day.",
      compatibilityRemaining: (remaining: number) =>
        `${remaining} test email${remaining === 1 ? "" : "s"} left today.`,
      recommended: "More templates",
      recommendedDescription: "Browse other designs from the community.",
      cards: [
        {
          name: "Big news: We've been backed by Y Combinator 🚀",
          description: "Bold startup funding announcement.",
        },
        {
          name: "Tu próximo hogar está a un clic — Hopta",
          description: "Clean real estate offer in Spanish.",
        },
        {
          name: "40% off everything — no exceptions",
          description: "High-contrast Black Friday promo.",
        },
        {
          name: "Beautiful emails, built in seconds — Madoo AI",
          description: "Editorial product update layout.",
        },
        {
          name: "We're officially backed by Y Combinator — here's what's next",
          description: "Investor-backed milestone note.",
        },
        {
          name: "We just shipped something big 🚀",
          description: "Dark invite-style product launch.",
        },
        {
          name: "Big ideas. Short sentences. Zero fluff.",
          description: "Minimal long-form newsletter.",
        },
      ],
    },
    cta: {
      eyebrow: "Madoo | AI Email Template Design Company",
      title: "Ready to craft?",
      placeholderPrefix: "Hi Madoo, ",
      placeholders: [
        "create a product launch email for my audience.",
        "make a newsletter from our latest product updates.",
        "create a new feature campaign for existing customers.",
        "write a marketer-ready promotion with a clear CTA.",
      ],
    },
  },
  es: {
    nav: {
      useCases: "Casos de uso",
      community: "Comunidad",
      emailTemplates: "Plantillas",
      pricing: "Precios",
      login: "Iniciar sesión",
      getStarted: "Empezar",
      goToApp: "Abrir app",
      mobileMenu: "Abrir navegación",
    },
    hero: {
      titleStart: "IA",
      titleAccent: "para Emails",
      subtitle: "Diseña tu plantilla de email con IA y avanza más rápido",
      placeholderPrefix: "Hola Madoo, ",
      placeholders: [
        "crea una plantilla de email para mi evento AWS Summit. Usa este enlace: link.com",
        "convierte esta actualización de producto en un newsletter corto para suscriptores.",
        "crea una campaña para lanzar una nueva función y activar usuarios actuales.",
        "escribe un email promocional para marketing con una llamada a la acción clara.",
      ],
      submit: "Generar email",
      explore: "Explorar ejemplos de plantillas",
      exportLabel: "Exporta a cualquier proveedor",
      addAttachment: "Añadir adjunto",
      microphone: "Usar micrófono",
    },
    workflow: {
      title: "Prompt. Diseño. Exportación.",
      description:
        "Pasa de una idea inicial a un email listo para producción sin empezar desde cero ni rehacer layouts.",
      steps: [
        {
          label: "Prompt",
          text: "Describe audiencia, oferta, tono y objetivo.",
        },
        {
          label: "Diseño",
          text: "Madoo lo convierte en un layout de email pulido.",
        },
        {
          label: "Exporta",
          text: "Envía HTML listo para producción a tu herramienta de email.",
        },
      ],
    },
    value: {
      eyebrow: "Creado para operaciones modernas de email",
      title:
        "Crea plantillas de email con asistencia de IA y publícalas con confianza.",
      description:
        "Empieza con un prompt, conviértelo en una plantilla de email con marca, revisa cada detalle de producción y expórtala a la herramienta que tu equipo ya usa.",
      status: "Creación asistida por IA",
      aiTitle: "Plantillas con IA",
      aiDescription:
        "Crea plantillas de email listas para campaña desde prompts simples y ajusta copy, secciones, tono y layout.",
      compatibilityTitle: "Compatibilidad",
      compatibilityDescription:
        "Revisa layout, copy, estructura y presentación responsive antes de exportar.",
      brandTitle: "Agrega tu brand kit",
      brandDescription:
        "Sube tu logo, colores y tipografías — Madoo genera emails con tu marca siempre.",
      workflowTitle: "Flujo de equipo",
      workflowDescription:
        "Aprobaciones, revisiones, dueños y handoff de campaña se mantienen visibles antes de exportar.",
      integrationsTitle: "Integraciones ESP",
      integrationsDescription:
        "Mueve campañas terminadas a Mailchimp, HubSpot, Klaviyo, Salesforce y otros ESPs.",
      qaTitle: "Motor de emails de prueba",
      qaDescription:
        "Envía emails de prueba desde Madoo para revisar el mensaje final antes de moverlo a tu herramienta de email.",
      clients: ["Desktop", "Mobile", "Copy", "Layout", "Export"],
      flow: ["Borrador", "Review", "Aprobado", "Exportar"],
      controls: [
        "Copy",
        "Layout",
        "Marca",
        "Audiencia",
        "Compliance",
        "Export",
      ],
      previewLabel: "preview",
      readyLabel: "Listo",
    },
    productFeatures: {
      cta: "Ver ejemplos",
      tabs: [
        {
          label: "Diseño y Layouts",
          title: "Diseña emails a tu manera",
          blocks: [
            {
              heading: "CONSTRUCTOR CON IA",
              body: (
                <>
                  Describe la audiencia, la oferta y el tono — Madoo convierte tu
                  prompt en un layout de email pulido y con tu marca.{" "}
                  <Hi color="#8b5cf6">Sin empezar de cero</Hi> ni armar secciones a
                  mano.
                </>
              ),
            },
            {
              heading: "AGREGA TU BRAND KIT",
              body: "Sube tu logo, colores y tipografías, y Madoo genera emails con tu marca siempre. Ajusta copy, secciones y layout hasta dejarlo perfecto.",
            },
          ],
        },
        {
          label: "Integraciones y Exportación",
          title: "Envía a cualquier herramienta",
          blocks: [
            {
              heading: "EXPORTA EN UN CLIC",
              body: (
                <>
                  Envía <Hi color="#5b63ff">HTML listo para producción</Hi> directo
                  a Mailchimp, Klaviyo, HubSpot, Salesforce y los demás ESPs que tu
                  equipo ya usa.
                </>
              ),
            },
            {
              heading: "HTML LIMPIO Y PORTABLE",
              body: "Cada email se exporta como HTML estándar que se ve igual donde lo pegues — sin lock-in ni retrabajo.",
            },
          ],
        },
        {
          label: "Ahorro y Automatización",
          title: "De la idea al inbox en minutos",
          blocks: [
            {
              heading: "DEL PROMPT AL EMAIL",
              body: (
                <>
                  Pasa de un prompt de una línea a una campaña terminada{" "}
                  <Hi color="#d97706">en segundos</Hi>. Itera con IA en vez de
                  rehacer layouts a mano.
                </>
              ),
            },
            {
              heading: "EMPIEZA CON PLANTILLAS",
              body: "Empieza con plantillas probadas por la comunidad y deja que la IA adapte copy, tono y audiencia a tu campaña.",
            },
          ],
        },
        {
          label: "Test Email Engine",
          title: "Test email engine",
          blocks: [
            {
              heading: "VERIFICA EL HTML GENERADO",
              body: (
                <>
                  Envía emails de prueba reales y verifica que el{" "}
                  <Hi color="#0d9488">HTML generado sea válido</Hi> antes de enviar.
                </>
              ),
            },
            {
              heading: "SPAM, ENLACES Y ACCESIBILIDAD",
              body: "Chequeos integrados de riesgo de spam, enlaces rotos y accesibilidad.",
            },
            {
              heading: "REVISIÓN DE EMAIL",
              body: "Revisa layout, copy, secciones y diseño responsive antes de exportar.",
            },
          ],
        },
        {
          label: "Compartir y Colaborar",
          title: "Mueve campañas en equipo",
          blocks: [
            {
              heading: "INVITA CON ROLES",
              body: "Invita a tu equipo como admins o miembros y controla qué puede ver cada uno en tu workspace.",
            },
            {
              heading: "REVISIONES Y APROBACIONES",
              body: (
                <>
                  Borradores, revisiones, dueños y aprobaciones quedan visibles
                  para que las campañas avancen{" "}
                  <Hi color="#0d9488">sin confusión</Hi>.
                </>
              ),
            },
            {
              heading: "WORKSPACE COMPARTIDO",
              body: "Comparte plantillas en tu workspace y entrega campañas terminadas de forma limpia antes de exportar.",
            },
          ],
        },
      ],
    },
    templates: {
      title: "Explora plantillas",
      description:
        "Empieza plantillas probadas por la comunidad y ajusta copy, layout, tono y audiencia con IA",
      browseAll: "Ver todas las plantillas",
      galleryTitle: "Plantillas de Email",
      galleryDescription:
        "Plantillas de email gratis y listas para usar, para cada campaña y ocasión. Elige una y hazla tuya con IA.",
      all: "Todas",
      searchPlaceholder: "Buscar plantillas",
      empty: "Aún no hay plantillas en esta categoría.",
      previewAlt: "vista previa de plantilla de email",
      hover: "Detalles",
      by: "Por",
      variables: "variables",
      noVariables: "Sin variables.",
      use: "Usar plantilla",
      using: "Abriendo…",
      close: "Cerrar",
      communityFallbackDescription: "Plantilla de la comunidad.",
      detailBack: "Todas las plantillas",
      preview: "Vista previa en vivo",
      viewDesktop: "Vista escritorio",
      viewMobile: "Vista móvil",
      schemeLight: "Modo claro",
      schemeDark: "Modo oscuro",
      aiGenerated: "Generado con IA",
      compatibilityTitle: "Míralo en tu bandeja de entrada",
      compatibilityPlaceholder: "tu@empresa.com",
      compatibilityCta: "Probar compatibilidad",
      compatibilitySending: "Enviando…",
      compatibilitySent: "¡Enviado! Revisa tu bandeja para ver cómo se renderiza.",
      compatibilityError: "No se pudo enviar la prueba. Inténtalo de nuevo.",
      compatibilityInvalidEmail: "Escribe un email válido.",
      compatibilityLimit: "Límite diario alcanzado — 3 emails de prueba al día.",
      compatibilityRemaining: (remaining: number) =>
        `Te queda${remaining === 1 ? "" : "n"} ${remaining} email${remaining === 1 ? "" : "s"} de prueba hoy.`,
      recommended: "Más plantillas",
      recommendedDescription: "Explora otros diseños de la comunidad.",
      cards: [
        {
          name: "Gran noticia: Y Combinator nos respaldó 🚀",
          description: "Anuncio potente de inversión startup.",
        },
        {
          name: "Tu próximo hogar está a un clic — Hopta",
          description: "Oferta inmobiliaria limpia en español.",
        },
        {
          name: "40% de descuento — sin exclusiones",
          description: "Promo Black Friday de alto contraste.",
        },
        {
          name: "Emails hermosos en segundos — Madoo AI",
          description: "Layout claro para update de producto.",
        },
        {
          name: "Y Combinator nos respaldó oficialmente — lo que sigue",
          description: "Nota de hito para inversionistas.",
        },
        {
          name: "Acabamos de lanzar algo grande 🚀",
          description: "Lanzamiento oscuro estilo invitación.",
        },
        {
          name: "Ideas grandes. Frases cortas. Cero ruido.",
          description: "Newsletter minimalista de largo formato.",
        },
      ],
    },
    cta: {
      eyebrow: "Constructor de Emails con IA",
      title: "¿Listo para crear?",
      placeholderPrefix: "Hola Madoo, ",
      placeholders: [
        "crea un email para lanzar mi producto.",
        "crea un newsletter con nuestras últimas novedades.",
        "crea una campaña para una nueva función.",
        "escribe una promoción para marketers con CTA claro.",
      ],
    },
  },
} as const;

/** Tiles shown in the homepage showcase row. */
const SHOWCASE_COLUMNS = 5;
/** Categories considered before the short-template filter runs. */
const SHOWCASE_CANDIDATES = 12;

export default function HomePage({
  locale = "en",
  communityTemplates = [],
}: HomePageProps) {
  const copy = localeCopy[locale];
  const localizedFallbackTemplateCards: TemplateShowcaseCard[] =
    templateCards.map((template, index) => ({
      ...template,
      name: copy.templates.cards[index]?.name ?? template.name,
      description:
        copy.templates.cards[index]?.description ?? template.description,
    }));
  const communityTemplateCards: TemplateShowcaseCard[] = communityTemplates.map(
    (template, index) => ({
      id: template.id,
      name: template.name,
      description:
        template.description ??
        template.category ??
        copy.templates.communityFallbackDescription,
      imageSrc:
        template.previewUrl ??
        templateCards[index % templateCards.length]?.imageSrc ??
        "/templates/news-letter.png",
      authorName: template.authorName,
      category: template.category,
      variableCount: template.variableCount,
      variables: template.variables,
      isCommunityTemplate: true,
    }),
  );
  // Show only real community templates when any exist. The hardcoded sample
  // cards are a fallback for an empty gallery, not padding to a minimum count —
  // padding made decorative cards look like real DB templates.
  const hasCommunityTemplates = communityTemplateCards.length > 0;
  // Homepage showcase: one card per category so the section reads as a category
  // overview (the full gallery lives on /templates). Candidates are picked wide
  // and then narrowed to the ones whose screenshot is tall enough for the
  // uniform tiles — short emails would sit in a mostly-empty crop.
  const showcaseCandidates = useMemo(
    () => pickCategoryShowcase(communityTemplateCards, SHOWCASE_CANDIDATES),
    [communityTemplateCards],
  );
  const categoryShowcase = useTallTemplates(
    showcaseCandidates,
    SHOWCASE_COLUMNS,
  );
  // Product-features section: tabs switch the copy and a matching product visual.
  // Designs & Layouts is the first tab and the default selection.
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);
  const activeTab =
    copy.productFeatures.tabs[activeFeatureTab] ??
    copy.productFeatures.tabs[0]!;
  const activeFeatureImage =
    featureTabImages[activeFeatureTab] ?? featureTabImages[0]!;
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<TemplatePreviewData | null>(null);
  const [usingTemplate, setUsingTemplate] = useState(false);
  const dictation = useDictation({ value: prompt, onChange: setPrompt });
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const ctaPromptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachments, setAttachments] = useState<PromptAttachment[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<PromptAttachment[]>([]);
  attachmentsRef.current = attachments;
  const [submitting, setSubmitting] = useState(false);
  // Image attachments handed to the login dialog so an anonymous visitor's paste
  // survives the sign-in round trip (uploaded once they have a session).
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);
  const hasPrompt = prompt.trim().length > 0;
  const heroPlaceholderBody = useTypingPlaceholder(copy.hero.placeholders);
  const ctaPlaceholderBody = useTypingPlaceholder(copy.cta.placeholders);
  const heroPlaceholder = `${copy.hero.placeholderPrefix}${heroPlaceholderBody}`;
  const ctaPlaceholder = `${copy.cta.placeholderPrefix}${ctaPlaceholderBody}`;

  // Revoke any leftover object URLs when the page unmounts.
  useEffect(() => {
    return () => {
      for (const attachment of attachmentsRef.current) {
        if (attachment.url) URL.revokeObjectURL(attachment.url);
      }
    };
  }, []);

  // Cookies aren't available during SSR, so detect the session after mount to
  // avoid a hydration mismatch on the header/prompt CTAs.
  useEffect(() => {
    setSignedIn(isLikelySignedIn());
  }, []);

  const openAuthDialog = () => setAuthDialogOpen(true);
  const closeAuthDialog = () => setAuthDialogOpen(false);

  // The prompt CTAs open the login dialog for anonymous visitors, but send
  // already-signed-in visitors straight into the app (carrying their prompt and
  // any attached images). A File can't ride the cross-subdomain navigation, so
  // signed-in visitors upload first and pass public image URLs; anonymous ones
  // hand the File objects to the dialog, which uploads after they get a session.
  const handlePromptSubmit = async () => {
    if (submitting) return;
    const imageFiles = attachmentsRef.current
      .map((attachment) => attachment.file)
      .filter((file) => file.type.startsWith("image/"));

    if (!signedIn) {
      setPendingImageFiles(imageFiles);
      openAuthDialog();
      return;
    }

    const trimmed = prompt.trim();
    if (!trimmed) {
      window.location.assign(clientHomeUrl());
      return;
    }

    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      setSubmitting(true);
      try {
        imageUrls = await uploadPromptImages(imageFiles);
      } catch {
        // Best effort: a failed upload still carries the text prompt across.
        imageUrls = [];
      }
    }

    window.location.assign(
      clientPromptUrl(trimmed, undefined, undefined, imageUrls),
    );
  };

  // Real templates open the full-page detail view (HTML preview + info +
  // recommendations). Decorative sample cards have no id, so they keep the
  // lightweight modal since there's no detail page to route to.
  const openTemplatePreview = (template: TemplateShowcaseCard) => {
    if (template.id) {
      router.push(`/templates/${template.id}`);
      return;
    }
    setPreviewTemplate(template);
  };

  // View is always free. "Use" needs an account: signed-in visitors go straight
  // to the app (which owns the session), otherwise we open the login dialog and
  // resume into the app once they authenticate. Decorative sample cards (no id)
  // just funnel to sign-up.
  const handleUseTemplate = (template: TemplatePreviewData) => {
    if (!template.id) {
      setPreviewTemplate(null);
      openAuthDialog();
      return;
    }

    const target = clientUseTemplateUrl(template.id);
    if (isLikelySignedIn()) {
      setUsingTemplate(true);
      window.location.assign(target);
      return;
    }

    setNextUrl(target);
    setPreviewTemplate(null);
    setAuthDialogOpen(true);
  };

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next = Array.from(files).map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`,
      file,
      url: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    }));
    setAttachments((current) => [...current, ...next]);
  };

  const onAttachmentInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files);
    // Reset so picking the same file again still fires onChange.
    event.target.value = "";
  };

  const onPromptPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    const files = Array.from(items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (files.length === 0) return;
    // Stop the pasted image's name/markup from also landing in the textarea.
    event.preventDefault();
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    addFiles(transfer.files);
  };

  const removeAttachment = (id: string) => {
    setAttachments((current) => {
      const target = current.find((attachment) => attachment.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return current.filter((attachment) => attachment.id !== id);
    });
  };

  const openImagePicker = () => imageInputRef.current?.click();
  const openFilePicker = () => fileInputRef.current?.click();
  const onTemplateCardKeyDown =
    (template: TemplateShowcaseCard) =>
      (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openTemplatePreview(template);
        }
      };

  const renderTemplateCard = (
    template: TemplateShowcaseCard,
    index: number,
  ) => (
    <article
      key={template.id ?? template.name}
      role="button"
      tabIndex={0}
      onClick={() => openTemplatePreview(template)}
      onKeyDown={onTemplateCardKeyDown(template)}
      className="group w-full min-w-0 cursor-pointer outline-none"
    >
      <TemplatePreviewImage
        src={template.imageSrc ?? "/templates/news-letter.png"}
        alt={`${template.name} ${copy.templates.previewAlt}`}
        defaultHeightRatio={
          templateDefaultHeightRatios[
          index % templateDefaultHeightRatios.length
          ]
        }
      />

      <div className="mt-2.5 font-ibm-plex-sans">
        <div className="min-w-0">
          <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[1.2] text-[#101114]">
            {template.name}
          </h3>
          <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-4 text-[#6f6961]">
            {template.description}
          </p>
          {template.isCommunityTemplate ? (
            <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden text-[11px] leading-4 text-[#8a8178]">
              <span className="truncate">
                {template.authorName
                  ? `${copy.templates.by} ${template.authorName}`
                  : (template.category ?? copy.nav.community)}
              </span>
              {(template.variableCount ?? 0) > 0 ? (
                <span className="shrink-0">
                  {template.variableCount} {copy.templates.variables}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );

  // Category showcase card: a representative preview with the category name as a
  // bold caption below, mirroring the homepage category overview row.
  const renderShowcaseCard = (template: TemplateShowcaseCard) => (
    <article
      key={template.id ?? template.name}
      role="button"
      tabIndex={0}
      onClick={() => openTemplatePreview(template)}
      onKeyDown={onTemplateCardKeyDown(template)}
      className="group flex min-w-0 cursor-pointer flex-col outline-none"
    >
      <div className="relative">
        <TemplateShowcaseImage
          src={template.imageSrc ?? "/templates/news-letter.png"}
          alt={`${template.name} ${copy.templates.previewAlt}`}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-madoo-ink/0 opacity-0 transition duration-200 group-hover:bg-madoo-ink/12 group-hover:opacity-100">
          <span className="rounded-full bg-white px-4 py-2 text-xs font-medium text-madoo-ink shadow-[0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.18)]">
            {copy.templates.hover}
          </span>
        </div>
      </div>

      <p className="mt-4 font-ibm-plex-sans text-sm font-semibold uppercase tracking-[0.14em] text-[#171717]">
        {template.category}
      </p>
    </article>
  );

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void handlePromptSubmit();
    }
  };

  useEffect(() => {
    [promptTextareaRef.current, ctaPromptTextareaRef.current].forEach(
      (textarea) => {
        if (!textarea) return;

        const maxHeight = textarea === ctaPromptTextareaRef.current ? 224 : 320;
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
        textarea.style.overflowY =
          textarea.scrollHeight > maxHeight ? "auto" : "hidden";
      },
    );
  }, [prompt]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingNext = params.get("next");
    if (!incomingNext) return;

    setNextUrl(incomingNext);

    const nextSearch = getNextSearchParams(incomingNext);
    const incomingPrompt = nextSearch?.get("prompt");

    if (incomingPrompt) setPrompt(incomingPrompt);

    setAuthDialogOpen(true);
  }, []);

  return (
    <>
      <AuthDialog
        open={authDialogOpen}
        onClose={closeAuthDialog}
        locale={locale}
        prompt={prompt}
        imageFiles={pendingImageFiles}
        nextUrl={nextUrl}
      />

      <TemplatePreviewDialog
        template={previewTemplate}
        isUsing={usingTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUse={handleUseTemplate}
        copy={{
          close: copy.templates.close,
          by: copy.templates.by,
          variables: copy.templates.variables,
          noVariables: copy.templates.noVariables,
          use: copy.templates.use,
          using: copy.templates.using,
          roleLabels: TEMPLATE_ROLE_LABELS,
        }}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onAttachmentInputChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={onAttachmentInputChange}
      />

      <main lang={locale} className="relative min-h-screen w-full">
        <div className="relative z-50 px-2 pb-3 pt-2 sm:px-2 sm:pb-4 sm:pt-2">
          <div className="relative isolate mx-auto flex min-h-[calc(100svh-1rem)] w-full max-w-[calc(100vw-1rem)] flex-col items-center justify-start gap-7 overflow-visible rounded-2xl px-4 pt-52 font-ibm-plex-sans shadow-[0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.14)] sm:max-w-[calc(100vw-1.5rem)] sm:gap-9 sm:px-6 lg:min-h-[150vh] lg:pt-65 2xl:pt-75 xl:max-w-[calc(100vw-2rem)]">
            <video
              src="/background-video.mp4"
              aria-hidden="true"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full rounded-2xl object-cover"
            />

            <div className="absolute left-0 right-0 top-0 z-[120]">
              <LandingHeader
                copy={copy.nav}
                onAuthClick={signedIn ? undefined : openAuthDialog}
                appUrl={signedIn ? clientHomeUrl() : undefined}
                goToAppLabel={copy.nav.goToApp}
              />
            </div>

            <Image
              src="/floating-icons/email-template-cut.png"
              alt=""
              width={2508}
              height={2508}
              aria-hidden="true"
              className="madoo-hero-float-email pointer-events-none absolute right-[max(3rem,calc(50%-42rem))] top-[15%] z-0 hidden h-auto w-54 select-none xl:block 2xl:w-70"
              priority
            />

            <Image
              src="/floating-icons/browser-template-cut.png"
              alt=""
              width={3068}
              height={2050}
              aria-hidden="true"
              className="madoo-hero-float-browser pointer-events-none absolute bottom-[40%] left-[max(2.5rem,calc(50%-48rem))] z-0 hidden h-auto w-86 select-none xl:block 2xl:w-114"
              priority
            />

            <div className="relative z-10 flex max-w-3xl flex-col gap-1.5 px-2">
              <h3 className="text-center text-4xl font-medium leading-[0.94] tracking-normal text-black sm:text-5xl">
                <span>{copy.hero.titleStart}</span>{" "}
                <span className="relative inline-flex items-center justify-center">
                  <span className="font-semibold text-black">
                    {copy.hero.titleAccent}
                  </span>
                </span>
              </h3>
              <h4 className="mt-1.5 text-center text-base font-light text-black sm:text-lg">
                {copy.hero.subtitle}
              </h4>
            </div>

            <div className="relative z-60 flex w-full max-w-[44rem] flex-col gap-2">
              <AttachmentPreviewList
                attachments={attachments}
                className="px-1"
                onRemove={removeAttachment}
              />
              <div className="madoo-paper-border w-full overflow-visible rounded-3xl bg-white">
                <textarea
                  ref={promptTextareaRef}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={onPromptKeyDown}
                  onPaste={onPromptPaste}
                  placeholder={hasPrompt ? "" : heroPlaceholder}
                  className="madoo-prompt-textarea mr-3 max-h-80 min-h-24 w-[calc(100%-0.75rem)] resize-none rounded-t-3xl bg-transparent px-5 pr-10 pt-5 text-sm text-[#101114] outline-none placeholder:text-zinc-500"
                />

                <div className="flex items-center justify-between gap-3 px-3.5 pb-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <AttachMenu
                      label={copy.hero.addAttachment}
                      onUploadFile={openFilePicker}
                      onUploadImage={openImagePicker}
                    />
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={dictation.toggle}
                      aria-pressed={dictation.isListening}
                      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-[background,color] duration-(--duration-fast) ease-out ${dictation.isListening
                          ? "bg-red-500/10 text-red-600"
                          : "text-[#101114] hover:bg-[rgb(var(--rule-rgb)/0.06)]"
                        }`}
                      aria-label={copy.hero.microphone}
                    >
                      <HugeiconsIcon
                        icon={Mic02Icon}
                        size={16}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handlePromptSubmit()}
                      disabled={submitting}
                      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-4 text-xs text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${hasPrompt
                          ? "bg-black"
                          : "bg-[#7d7d7a] hover:bg-[#666663]"
                        }`}
                      aria-label={copy.hero.submit}
                    >
                      {copy.hero.submit}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-sm text-center">
                <h6 className="text-xs font-light text-zinc-600">
                  {copy.hero.exportLabel}
                </h6>
                <div className="mt-3 w-full overflow-hidden">
                  <div className="madoo-provider-marquee flex w-max gap-3">
                    {movingExportProviders.map((provider, index) => (
                      <div
                        key={`${provider.name}-${index}`}
                        className="flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 pr-4"
                      >
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-full"
                          style={{
                            backgroundColor:
                              providerLogoSwatches[
                              index % providerLogoSwatches.length
                              ],
                          }}
                        >
                          <img
                            src={provider.iconSrc}
                            alt={`${provider.name} logo`}
                            className="h-5 w-5 object-contain"
                            loading="lazy"
                          />
                        </span>
                        <span className="whitespace-nowrap text-xs font-medium text-[#1f2937]">
                          {provider.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="madoo-paper-section relative z-10 w-full px-4 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-80 xl:px-0">
          <div className="mx-auto w-full max-w-7xl font-ibm-plex-sans">
            <div
              className="flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-4"
              role="tablist"
              aria-label={copy.value.title}
            >
              {copy.productFeatures.tabs.map((tab, index) => {
                const active = index === activeFeatureTab;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveFeatureTab(index)}
                    className={cx(
                      "h-10 cursor-pointer rounded-full border-0 px-4 text-sm font-medium transition",
                      active
                        ? "madoo-paper-border bg-white text-[#171717]"
                        : "bg-transparent text-[#6f6961] hover:text-[#171717]",
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-8">
              <div
                key={`feature-copy-${activeFeatureTab}`}
                className="madoo-tab-panel flex flex-col"
              >
                <h2 className="max-w-xl text-4xl font-semibold uppercase leading-[0.95] tracking-tight text-[#171717] sm:text-5xl">
                  {activeTab.title}
                </h2>

                <div
                  className={cx(
                    "mt-8 grid",
                    activeTab.blocks.length >= 3 ? "gap-10" : "gap-12",
                  )}
                >
                  {activeTab.blocks.map((block, blockIndex) => {
                    const icon =
                      featureTabIcons[activeFeatureTab]?.[blockIndex];
                    return (
                      <div className="madoo-feature-block" key={block.heading}>
                        <div className="flex items-center gap-2.5">
                          {icon ? (
                            <HugeiconsIcon
                              icon={icon}
                              size={22}
                              strokeWidth={2}
                              className="madoo-feature-icon shrink-0 text-[#171717]"
                              aria-hidden="true"
                            />
                          ) : null}
                          <h3 className="text-xl font-bold uppercase tracking-tight text-[#171717]">
                            {block.heading}
                          </h3>
                        </div>
                        <p className="mt-2 max-w-xl text-lg leading-8 text-[#6f6961]">
                          {block.body}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <a
                  href="#templates"
                  className="mt-8 inline-flex h-12 w-fit cursor-pointer items-center justify-center rounded-full bg-madoo-ink px-7 text-sm font-semibold text-white transition hover:bg-madoo-ink-hover"
                >
                  {copy.productFeatures.cta}
                </a>
              </div>

              <div
                key={`feature-media-${activeFeatureTab}`}
                className="madoo-tab-panel relative mx-auto w-full max-w-xl"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-white">
                  <img
                    src={activeFeatureImage.src}
                    alt={activeFeatureImage.alt}
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="templates"
          className="madoo-paper-section madoo-paper-templates relative z-10 my-24 mb-28 w-full px-4 sm:my-36 sm:mb-44 sm:px-8 lg:my-56 lg:mb-80 xl:px-0"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex w-full flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-figtree text-3xl font-semibold text-[#171717] sm:text-5xl">
                  {copy.templates.title}
                </h2>
                <h4 className="mt-3 max-w-xl font-figtree text-zinc-600">
                  {copy.templates.description}
                </h4>
              </div>
              <Link
                href="/templates"
                className="madoo-paper-border madoo-paper-border-hover inline-flex h-10 w-fit shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-white px-4 font-ibm-plex-sans text-sm font-medium text-madoo-ink transition"
              >
                {copy.templates.browseAll}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={15}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </Link>
            </div>

            {hasCommunityTemplates ? (
              // Empty until the screenshots have been measured; the fallback
              // sample cards must not flash in during that pass.
              <div className="mt-10 grid grid-cols-2 items-start gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {categoryShowcase.map(renderShowcaseCard)}
              </div>
            ) : (
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {localizedFallbackTemplateCards.map(renderTemplateCard)}
              </div>
            )}
          </div>
        </section>

        <section className="relative z-10 mx-2 my-24 flex min-h-[34rem] items-center overflow-hidden rounded-2xl px-4 py-16 sm:mx-4 sm:my-36 sm:min-h-[80vh] sm:rounded-3xl sm:py-20 lg:my-44">
          <Image
            src="/background-photo-2.webp"
            alt=""
            fill
            sizes="100vw"
            className="pointer-events-none absolute inset-0 -z-10 object-cover"
            aria-hidden="true"
          />
          <div className="mx-auto mb-4 flex w-full max-w-4xl flex-col items-center text-center font-ibm-plex-sans">
            <div className="inline-flex items-center gap-2 rounded-full px-3 text-sm text-zinc-800">
              {copy.cta.eyebrow}
            </div>

            <h2 className="text-4xl font-extralight leading-none tracking-normal text-black text-shadow-lg sm:text-5xl">
              {copy.cta.title}
            </h2>

            <div className="mt-9 flex w-full max-w-xl flex-col gap-2">
              <AttachmentPreviewList
                attachments={attachments}
                className="px-1"
                onRemove={removeAttachment}
              />
              <div className="madoo-paper-border w-full overflow-visible rounded-3xl bg-white text-left">
                <textarea
                  ref={ctaPromptTextareaRef}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={onPromptKeyDown}
                  onPaste={onPromptPaste}
                  placeholder={hasPrompt ? "" : ctaPlaceholder}
                  className="madoo-prompt-textarea mr-3 max-h-56 min-h-20 w-[calc(100%-0.75rem)] resize-none rounded-t-3xl bg-transparent px-5 pr-10 pt-5 text-sm text-[#101114] outline-none placeholder:text-zinc-500"
                />

                <div className="flex items-center justify-between gap-3 px-3.5 pb-3">
                  <AttachMenu
                    label={copy.hero.addAttachment}
                    onUploadFile={openFilePicker}
                    onUploadImage={openImagePicker}
                  />

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={dictation.toggle}
                      aria-pressed={dictation.isListening}
                      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-[background,color] duration-(--duration-fast) ease-out ${dictation.isListening
                          ? "bg-red-500/10 text-red-600"
                          : "text-[#101114] hover:bg-[rgb(var(--rule-rgb)/0.06)]"
                        }`}
                      aria-label={copy.hero.microphone}
                    >
                      <HugeiconsIcon
                        icon={Mic02Icon}
                        size={16}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => void handlePromptSubmit()}
                      disabled={submitting}
                      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-4 text-xs text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${hasPrompt
                          ? "bg-black"
                          : "bg-[#7d7d7a] hover:bg-[#666663]"
                        }`}
                      aria-label={copy.hero.submit}
                    >
                      {copy.hero.submit}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
