"use client";

import {
  Add01Icon,
  AiIdeaIcon,
  ArrowRight01Icon,
  Attachment01Icon,
  Cancel01Icon,
  Download01Icon,
  Image01Icon,
  Mic02Icon,
  WebDesign01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  Select,
  cx,
} from "@madoo/design-system";
import { CLIENT_APP_URL } from "@/lib/env";
import { useDictation } from "@/lib/use-dictation";
import type { LandingCommunityTemplate } from "@/lib/community-templates";
import type { VariableSchemaRoot } from "@madoo/shared";
import Image from "next/image";
import type { ChangeEvent, KeyboardEvent, SVGAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import AuthDialog from "./AuthDialog";
import TemplatePreviewDialog, {
  type TemplatePreviewData,
} from "./TemplatePreviewDialog";
import { LandingHeader } from "./LandingHeader";

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

const workflowSteps = [
  {
    label: "Prompt",
    text: "Describe the audience, offer, tone, and goal.",
    icon: AiIdeaIcon,
  },
  {
    label: "Design",
    text: "Madoo turns it into a polished email layout.",
    icon: WebDesign01Icon,
  },
  {
    label: "Export",
    text: "Send production-ready HTML to your email tool.",
    icon: Download01Icon,
  },
];

const templateMasonryWeights = [1.25, 1.4, 1.33, 1.43, 1.5] as const;
// Tile heights (height / width) used before the preview image loads; mirrors
// `templateMasonryWeights` so the masonry stays balanced while images stream in.
const templateDefaultHeightRatios = [1.25, 1.4, 1.33, 1.43, 1.5] as const;
// Once the real preview loads we size the tile to its true aspect ratio so a
// long email reads as a long card instead of being cropped into a short box.
const TEMPLATE_MIN_HEIGHT_RATIO = 0.6;
const TEMPLATE_MAX_HEIGHT_RATIO = 2.3;

function clampTemplateHeightRatio(ratio: number): number {
  return Math.min(
    TEMPLATE_MAX_HEIGHT_RATIO,
    Math.max(TEMPLATE_MIN_HEIGHT_RATIO, ratio),
  );
}

/**
 * Preview image whose tile grows to the screenshot's real aspect ratio, so long
 * email templates render as tall cards instead of being squeezed flat.
 */
function TemplatePreviewImage({
  src,
  alt,
  defaultHeightRatio,
}: {
  src: string;
  alt: string;
  defaultHeightRatio: number;
}) {
  const [heightRatio, setHeightRatio] = useState(defaultHeightRatio);

  return (
    <div
      className="relative flex min-h-0 items-start justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.16)] transition group-hover:shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.28)] group-focus-visible:ring-2 group-focus-visible:ring-[#5b63ff]/40"
      style={{ aspectRatio: 1 / heightRatio }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-top brightness-[1.05] contrast-[1.02] saturate-[1.03]"
        loading="lazy"
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget;
          if (naturalWidth > 0 && naturalHeight > 0) {
            setHeightRatio(
              clampTemplateHeightRatio(naturalHeight / naturalWidth),
            );
          }
        }}
      />
    </div>
  );
}

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

const TEMPLATE_ROLE_LABELS: Record<string, string> = {
  text: "Text",
  url: "URL",
  image: "Image",
  date: "Date",
};

const WORKSPACE_COOKIE = "madoo.workspace.id";

/**
 * The auth + workspace cookies are shared across `.madooai.com`, and the
 * workspace cookie is readable from JS — its presence is a good-enough signal
 * that the visitor is already signed in, so we can send them straight to the
 * app to use a template instead of forcing the login dialog.
 */
function isLikelySignedIn(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${WORKSPACE_COOKIE}=`));
}

function clientUseTemplateUrl(id: string): string {
  const url = new URL("/use-template", CLIENT_APP_URL);
  url.searchParams.set("id", id);
  return url.toString();
}

// Already-signed-in visitors own a session on the app, so their prompt is handed
// straight to the app to start generating instead of through the login dialog.
function clientPromptUrl(prompt: string, tone?: string, length?: string): string {
  const url = new URL("/email-template-project", CLIENT_APP_URL);
  url.searchParams.set("prompt", prompt);
  if (tone) url.searchParams.set("tone", tone);
  if (length) url.searchParams.set("length", length);
  return url.toString();
}

function clientHomeUrl(): string {
  return new URL("/", CLIENT_APP_URL).toString();
}

function getRequestedMasonryColumnCount(maxColumns: number) {
  if (window.matchMedia("(min-width: 1280px)").matches) return maxColumns;
  if (window.matchMedia("(min-width: 1024px)").matches) {
    return Math.min(maxColumns, 3);
  }
  return 0;
}

function useResponsiveMasonryColumnCount(
  itemCount: number,
  maxColumns: number,
) {
  const [columnCount, setColumnCount] = useState(0);

  useEffect(() => {
    const queries = [
      window.matchMedia("(min-width: 1280px)"),
      window.matchMedia("(min-width: 1024px)"),
    ];

    const updateColumnCount = () => {
      const requested = getRequestedMasonryColumnCount(maxColumns);
      if (requested === 0) {
        setColumnCount(0);
        return;
      }

      setColumnCount(
        Math.max(1, Math.min(itemCount || 1, maxColumns, requested)),
      );
    };

    updateColumnCount();
    queries.forEach((query) =>
      query.addEventListener("change", updateColumnCount),
    );

    return () => {
      queries.forEach((query) =>
        query.removeEventListener("change", updateColumnCount),
      );
    };
  }, [itemCount, maxColumns]);

  return columnCount;
}

function buildTemplateMasonryColumns(
  templates: TemplateShowcaseCard[],
  columnCount: number,
) {
  const columns = Array.from(
    { length: Math.max(1, Math.min(columnCount, templates.length || 1)) },
    () => ({
      entries: [] as Array<{ index: number; template: TemplateShowcaseCard }>,
      weight: 0,
    }),
  );

  templates.forEach((template, index) => {
    const target = columns.reduce((shortest, column) =>
      column.weight < shortest.weight ? column : shortest,
    );
    target.entries.push({ index, template });
    target.weight +=
      templateMasonryWeights[index % templateMasonryWeights.length];
  });

  return columns;
}

const localeCopy = {
  en: {
    nav: {
      solutions: "Solutions",
      resources: "Resources",
      community: "Community",
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
    promptOptions: [
      {
        label: "Tone",
        options: ["Friendly", "Professional", "Bold", "Luxury"],
        menuWidth: 160,
      },
      {
        label: "Length",
        options: ["Short", "Medium", "Long"],
        menuWidth: 144,
      },
    ],
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
        "Preview email behavior across Gmail, Outlook, Apple Mail, and more before launch.",
      brandTitle: "Brand systems",
      brandDescription:
        "Reusable templates, layout rules, colors, type, blocks, and saved campaign patterns.",
      workflowTitle: "Team workflow",
      workflowDescription:
        "Approvals, reviews, ownership, and campaign handoff stay visible before export.",
      integrationsTitle: "ESP integrations",
      integrationsDescription:
        "Move finished campaigns into Mailchimp, HubSpot, Klaviyo, Salesforce, and other ESPs.",
      qaTitle: "Test email engine",
      qaDescription:
        "Send real test emails straight from Madoo to verify your HTML renders correctly in Gmail, Outlook, and more before you ship.",
      clients: ["Gmail", "Outlook", "Apple Mail", "Yahoo", "Mobile"],
      flow: ["Draft", "Review", "Approved", "Export"],
      controls: ["Copy", "Layout", "Brand", "Audience", "Compliance", "Export"],
      previewLabel: "preview",
      readyLabel: "Ready",
    },
    templates: {
      title: "Explore templates",
      description:
        "Start from community-tested templates, then adjust copy, layout, tone, and audience with AI.",
      previewAlt: "email template preview",
      hover: "Template Details",
      by: "By",
      variables: "variables",
      noVariables: "No variables.",
      use: "Use template",
      using: "Opening…",
      close: "Close",
      communityFallbackDescription: "Community template.",
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
      eyebrow: "Madoo | AI Email Design Company",
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
      solutions: "Soluciones",
      resources: "Recursos",
      community: "Comunidad",
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
    promptOptions: [
      {
        label: "Tono",
        options: ["Cercano", "Profesional", "Directo", "Premium"],
        menuWidth: 168,
      },
      {
        label: "Longitud",
        options: ["Corta", "Media", "Larga"],
        menuWidth: 152,
      },
    ],
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
        "Previsualiza el comportamiento en Gmail, Outlook, Apple Mail y más antes de lanzar.",
      brandTitle: "Sistemas de marca",
      brandDescription:
        "Plantillas reutilizables, reglas de layout, colores, tipografías, bloques y patrones guardados.",
      workflowTitle: "Flujo de equipo",
      workflowDescription:
        "Aprobaciones, revisiones, dueños y handoff de campaña se mantienen visibles antes de exportar.",
      integrationsTitle: "Integraciones ESP",
      integrationsDescription:
        "Mueve campañas terminadas a Mailchimp, HubSpot, Klaviyo, Salesforce y otros ESPs.",
      qaTitle: "Motor de emails de prueba",
      qaDescription:
        "Envía emails de prueba reales desde Madoo para verificar que tu HTML se renderiza bien en Gmail, Outlook y más antes de lanzar.",
      clients: ["Gmail", "Outlook", "Apple Mail", "Yahoo", "Mobile"],
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
    templates: {
      title: "Explora plantillas",
      description:
        "Empieza plantillas probadas por la comunidad y ajusta copy, layout, tono y audiencia con IA",
      previewAlt: "vista previa de plantilla de email",
      hover: "Detalles",
      by: "Por",
      variables: "variables",
      noVariables: "Sin variables.",
      use: "Usar plantilla",
      using: "Abriendo…",
      close: "Cerrar",
      communityFallbackDescription: "Plantilla de la comunidad.",
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

const placeholderTypingDelay = 36;
const placeholderDeletingDelay = 18;
const placeholderHoldDelay = 3200;
const placeholderRestartDelay = 420;

function useTypingPlaceholder(texts: readonly string[]) {
  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    if (texts.length === 0) {
      setPlaceholder("");
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaceholder(texts[0] ?? "");
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    let textIndex = 0;
    let characterIndex = 0;
    let isDeleting = false;

    const tick = () => {
      const text = texts[textIndex] ?? "";

      if (!isDeleting) {
        characterIndex = Math.min(characterIndex + 1, text.length);
        setPlaceholder(text.slice(0, characterIndex));

        if (characterIndex === text.length) {
          isDeleting = true;
          timeout = setTimeout(tick, placeholderHoldDelay);
          return;
        }

        timeout = setTimeout(tick, placeholderTypingDelay);
        return;
      }

      characterIndex = Math.max(characterIndex - 1, 0);
      setPlaceholder(text.slice(0, characterIndex));

      if (characterIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        timeout = setTimeout(tick, placeholderRestartDelay);
        return;
      }

      timeout = setTimeout(tick, placeholderDeletingDelay);
    };

    setPlaceholder("");
    timeout = setTimeout(tick, placeholderRestartDelay);

    return () => clearTimeout(timeout);
  }, [texts]);

  return placeholder;
}

function getNextSearchParams(nextUrl: string) {
  try {
    return new URL(nextUrl, CLIENT_APP_URL).searchParams;
  } catch {
    return null;
  }
}

function TemplateHoverArrow(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width="84"
      height="87"
      viewBox="0 0 84 87"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M43.7193 12.9259C43.7188 12.9245 43.7179 12.9234 43.717 12.9226C43.7141 12.92 43.71 12.92 43.71 12.92C43.7172 12.92 43.7192 12.92 43.7198 12.9236C43.72 12.9251 43.72 12.9271 43.72 12.93C43.72 12.9284 43.7197 12.927 43.7193 12.9259Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M83.03 55.34C83.1728 54.9071 83.1004 54.4491 82.8895 54.0611C82.9771 53.8157 83.0024 53.544 83.02 53.28C83.0773 52.3142 82.7929 51.3417 82.5178 50.4008C82.4568 50.1922 82.3963 49.9851 82.34 49.78C82.2395 49.4136 82.1495 49.0437 82.0597 48.6743C82.025 48.5316 81.9903 48.389 81.955 48.2467C81.9271 48.1342 81.8989 48.0219 81.87 47.91C81.8464 47.7872 81.8234 47.6651 81.8006 47.5432C81.7752 47.4069 81.7501 47.2709 81.725 47.135C81.7049 47.0258 81.6847 46.9165 81.6644 46.807C81.6368 46.6585 81.6088 46.5097 81.58 46.36C81.5583 46.2387 81.5345 46.1163 81.5107 45.9934C81.4579 45.7211 81.4044 45.4456 81.37 45.17C81.31 44.6046 81.2474 44.0418 81.1849 43.4789L81.1193 42.8871C81.0789 42.522 81.0389 42.1565 81 41.79C80.9952 41.6767 80.9906 41.5632 80.9862 41.4495C80.9769 41.2118 80.9685 40.9734 80.96 40.735C80.9475 40.3825 80.935 40.03 80.92 39.68C80.9129 39.4481 80.8994 39.215 80.8859 38.9819L80.8858 38.9806C80.8615 38.561 80.8372 38.1411 80.85 37.73C80.89 36.24 80.93 34.76 80.98 33.28C81.0448 32.5173 81.1096 31.7572 81.1744 30.997L81.1902 30.8122C81.2501 30.109 81.3101 29.4056 81.37 28.7C81.41 28.24 81.4767 27.78 81.5434 27.32C81.5767 27.09 81.61 26.86 81.64 26.63C81.77 25.69 81.89 24.76 82.01 23.82C82.1499 22.7148 82.3241 21.6096 82.4983 20.5044L82.4985 20.5026L82.4998 20.4947C82.5741 20.0231 82.6484 19.5516 82.72 19.08C82.95 17.5501 83.17 16.02 83.39 14.48C83.53 13.56 83.64 12.63 83.73 11.7C83.86 10.39 83.98 9.05 83.93 7.74C83.85 5.49 83.5 3.02003 81.63 1.52003C81.16 1.14003 80.55 0.930005 79.98 0.750012C79.44 0.590039 78.85 0.579968 78.3 0.599988C77.38 0.630017 76.46 0.720044 75.55 0.880017C75.3999 0.907605 75.2495 0.934461 75.099 0.96095C74.9221 0.992139 74.745 1.02272 74.5679 1.0533C73.9123 1.16664 73.2567 1.27998 72.61 1.42C69.377 2.12178 66.144 2.85139 62.9169 3.57972L62.8912 3.58558L61.01 4.01002C60.2706 4.15199 59.5336 4.2964 58.7967 4.44081L58.7503 4.44996C57.9977 4.59749 57.2451 4.74501 56.49 4.89003C55.4433 5.08284 54.3871 5.24244 53.3346 5.4015L53.3295 5.40223C52.8552 5.47395 52.3816 5.54554 51.91 5.62001C50.8222 5.7953 49.729 5.92793 48.6344 6.06074H48.6333C48.229 6.10975 47.8245 6.15883 47.42 6.21003C46.4241 6.33992 45.4125 6.42817 44.4041 6.51613L44.4017 6.51631C44.1825 6.53541 43.9635 6.55446 43.7449 6.57399C43.5764 6.589 43.408 6.60426 43.24 6.62001C43.0227 6.63124 42.8053 6.64283 42.5877 6.65443C41.2529 6.72572 39.9127 6.79725 38.58 6.78004L38.5508 6.77968C37.7603 6.76979 36.9603 6.75978 36.17 6.74L36.1325 6.73927C35.6645 6.7295 35.1873 6.71949 34.71 6.70002C34.26 6.68001 33.85 6.73005 33.4 6.82002C33.08 6.89003 32.77 7.12001 32.51 7.32002C31.77 7.89003 31.57 9.05 32.19 9.8C32.7651 10.4901 33.5494 10.9912 34.3155 11.4808C34.3853 11.5253 34.4549 11.5698 34.5242 11.6143C34.6202 11.676 34.7157 11.7378 34.81 11.8C35.3264 12.1443 35.8611 12.4641 36.3951 12.7833L36.3989 12.7855C36.5461 12.8735 36.6933 12.9616 36.84 13.05C38.4 13.98 39.96 14.88 41.54 15.76C43 16.57 44.52 17.28 46.06 17.94C46.8 18.26 47.54 18.57 48.29 18.87C48.4674 18.9385 48.6451 19.0065 48.8228 19.0745L48.8244 19.075C49.7878 19.4438 50.7517 19.8128 51.68 20.26C52.05 20.46 52.41 20.6701 52.76 20.9L53 21.08C53.09 21.16 53.18 21.25 53.27 21.35C53.245 21.32 53.22 21.2925 53.195 21.265C53.17 21.2375 53.145 21.21 53.12 21.18C53.1407 21.2007 53.1606 21.2214 53.18 21.2421C53.2279 21.2933 53.2722 21.3449 53.3151 21.3978C53.3473 21.4376 53.3787 21.4782 53.41 21.52C53.43 21.56 53.45 21.6 53.48 21.64L53.51 21.7C53.51 21.7042 53.5117 21.7083 53.5137 21.7132C53.5166 21.72 53.52 21.7283 53.52 21.74C53.53 21.75 53.53 21.77 53.53 21.78C53.5262 21.7877 53.5238 21.7938 53.5218 21.7991C53.5186 21.8076 53.5162 21.8138 53.51 21.82C53.5 21.85 53.48 21.88 53.46 21.91L53.43 21.94C53.4256 21.9443 53.4208 21.9487 53.4157 21.9531L53.4087 21.9592C53.4036 21.9636 53.3984 21.9682 53.3932 21.973C53.3873 21.9783 53.3815 21.9839 53.376 21.9899C53.3703 21.9962 53.3648 22.0028 53.36 22.01C53.16 22.18 52.95 22.35 52.73 22.5C51.4858 23.2966 50.1841 24.0126 48.8859 24.7266L48.8689 24.7359C48.4616 24.96 48.0547 25.1838 47.65 25.41C47.2688 25.6259 46.8861 25.8411 46.503 26.0567L46.4804 26.0693C45.4339 26.6579 44.384 27.2484 43.35 27.86C43.0778 28.0204 42.8055 28.1806 42.5334 28.3406L42.5247 28.3458C41.1203 29.1721 39.7181 29.997 38.33 30.85C37.7827 31.1904 37.2342 31.5297 36.6857 31.869C35.5909 32.5464 34.496 33.2238 33.41 33.91C30.11 35.99 26.82 38.06 23.52 40.12C23.0953 40.3867 22.6706 40.6533 22.2459 40.9198L22.2424 40.9219L22.2397 40.9236C19.3069 42.7642 16.377 44.6031 13.47 46.48C11.63 47.67 9.78001 48.85 7.91002 50C7.22001 50.42 6.51001 50.83 5.79001 51.21C5.64849 51.2882 5.50696 51.3638 5.36544 51.4383C5.29576 51.475 5.22608 51.5114 5.1564 51.5476L4.92001 51.67C4.85001 51.7 4.79001 51.7301 4.73002 51.77C4.46001 51.71 4.17 51.71 3.88001 51.79C3.05558 52.014 2.48813 52.8483 2.58061 53.6813C2.5132 53.8252 2.46209 53.9761 2.43002 54.13C2.23295 55.0471 2.14504 55.9873 2.05742 56.9242C2.02944 57.2234 2.00148 57.5223 1.97002 57.82C1.89001 58.5961 1.8036 59.3722 1.71719 60.1483C1.5876 61.3122 1.45801 62.4761 1.35002 63.64C1.28528 64.3054 1.20244 64.9681 1.11963 65.6306C0.97221 66.81 0.824833 67.9891 0.780018 69.18C0.775944 69.3125 0.769795 69.4467 0.7636 69.5817C0.739399 70.1091 0.71452 70.6507 0.810017 71.16C0.940014 71.86 1.21002 72.47 1.51002 73.11C1.53698 73.1684 1.56344 73.2268 1.58985 73.2851C1.68097 73.4863 1.77147 73.6862 1.88002 73.88C1.99002 74.15 2.14002 74.4301 2.28002 74.69L2.28107 74.6918C2.49072 75.0712 2.70041 75.4507 2.93002 75.83C3.41002 76.6301 3.91002 77.44 4.48002 78.18C5.11002 78.9901 5.78002 79.7401 6.52002 80.4501C6.88687 80.7995 7.2639 81.1353 7.64122 81.4713C7.91188 81.7124 8.1827 81.9536 8.45002 82.2001C9.14002 82.84 9.81002 83.5 10.47 84.1801C11.49 85.2301 12.66 86.2 14.18 86.36C15.0567 86.4616 15.9333 86.4609 16.8178 86.4602L17.04 86.4601C17.39 86.47 17.73 86.47 18.07 86.4601C18.58 86.4601 19.08 86.4401 19.58 86.39C20.68 86.28 21.76 86 22.75 85.48C24.0676 84.7938 25.1508 83.7978 26.2293 82.8061L26.4517 82.6018C26.5358 82.5292 26.6189 82.4556 26.7018 82.382C26.9008 82.2056 27.0995 82.0294 27.31 81.87C27.59 81.66 27.87 81.46 28.16 81.25C28.4545 81.0604 28.7514 80.8732 29.0483 80.6861C29.3464 80.4982 29.6445 80.3104 29.94 80.12C30.0551 80.0468 30.1711 79.9738 30.2874 79.9007C30.8379 79.5546 31.3946 79.2046 31.89 78.8C31.967 78.7379 32.0444 78.6759 32.122 78.6137C32.6698 78.1746 33.2283 77.7268 33.71 77.21C34.25 76.6401 34.78 76.0501 35.3 75.46C35.84 74.8501 36.39 74.27 36.99 73.72C37.2007 73.5462 37.4109 73.372 37.621 73.1978L37.6284 73.1917C38.3833 72.566 39.1375 71.9409 39.91 71.34C40.41 70.9601 40.91 70.58 41.39 70.17C41.4807 70.092 41.5713 70.0136 41.6622 69.935L41.6637 69.9337C42.0032 69.6398 42.3454 69.3437 42.7 69.06C43.66 68.2901 44.64 67.53 45.63 66.81C45.8083 66.6809 45.9892 66.555 46.17 66.4292C46.6892 66.0682 47.2076 65.7077 47.66 65.27C48.1989 64.7498 48.6859 64.1777 49.1693 63.61L49.28 63.48C49.7309 62.9852 50.1998 62.5055 50.6687 62.026L50.6733 62.0212C51.0556 61.6301 51.4378 61.2391 51.81 60.84C52.6 60.0001 53.46 59.2301 54.32 58.46C55.21 57.66 56.05 56.84 56.84 55.95C57.2973 55.4414 57.7284 54.9066 58.1595 54.3718C58.4826 53.9708 58.8058 53.5699 59.14 53.18C59.6 52.68 60.07 52.21 60.57 51.76C60.86 51.52 61.16 51.28 61.47 51.07C61.54 51.03 61.62 50.9801 61.7 50.94C61.76 50.9201 61.82 50.89 61.87 50.87C61.95 50.85 62.02 50.83 62.1 50.81C62.1343 50.8032 62.1698 50.7963 62.2061 50.7898C62.2755 50.7775 62.3478 50.7666 62.42 50.76C62.57 50.7501 62.72 50.7501 62.86 50.76C62.9741 50.7688 63.0805 50.7853 63.1927 50.8027L63.24 50.81C63.3182 50.8296 63.3869 50.8492 63.4553 50.8687L63.46 50.87C63.56 50.91 63.66 50.95 63.75 51C63.7752 51.0151 63.7978 51.0277 63.8205 51.0403C63.8428 51.0527 63.8652 51.0651 63.89 51.08C63.99 51.1401 64.08 51.22 64.17 51.29L64.47 51.59C64.6352 51.7841 64.7969 51.9833 64.9587 52.1826L64.9611 52.1856C65.1905 52.4681 65.4201 52.7509 65.66 53.02C66.03 53.4301 66.41 53.83 66.79 54.22C67.5 55.05 68.19 55.9201 68.84 56.81L68.8733 56.8593C69.3618 57.5825 69.8431 58.2949 70.42 58.95C70.7008 59.2645 70.9942 59.5632 71.2878 59.8621L71.2896 59.8639C71.5182 60.0967 71.747 60.3295 71.97 60.57C72.2357 60.8807 72.4953 61.1956 72.7552 61.5108L72.7568 61.5126C73.0735 61.8967 73.3907 62.2813 73.72 62.66C74.03 63.01 74.33 63.34 74.69 63.63C75.32 64.1201 76.1 64.21 76.87 64.14C77.34 64.1 77.92 63.89 78.36 63.72C78.96 63.48 79.49 63.11 79.9 62.61C80.7562 61.5692 81.1685 60.2817 81.5745 59.0138C81.6522 58.7712 81.7297 58.5293 81.81 58.29C81.82 58.255 81.8325 58.22 81.845 58.1849L81.8543 58.1589C81.8636 58.1326 81.8725 58.1063 81.88 58.08C81.875 58.1001 81.87 58.1176 81.865 58.1351C81.86 58.1526 81.855 58.1701 81.85 58.19C81.92 57.97 82 57.7401 82.1 57.53C82.48 56.8401 82.78 56.09 83.03 55.34ZM12.47 73.6C13.18 74.55 13.98 75.57 14.95 76.28C15.78 76.89 16.74 77.38 17.77 77.33C17.9 77.33 18.03 77.33 18.16 77.31C19.21 77.19 20.19 76.75 21.09 76.22C22.01 75.68 22.92 75.08 23.78 74.44C24.0147 74.2647 24.2524 74.0905 24.4909 73.9156L24.4972 73.911C25.0186 73.5288 25.5437 73.1438 26.05 72.74C27.69 71.42 29.31 70.09 30.92 68.73C31.5147 68.2316 32.1165 67.7402 32.7187 67.2485L32.7205 67.247C33.5555 66.5652 34.3912 65.8828 35.21 65.18C38.28 62.55 41.33 59.91 44.35 57.23C47.22 54.68 49.99 52.02 52.66 49.25C53.9 47.97 55.11 46.6701 56.29 45.34C57.3576 44.1291 58.4098 42.908 59.4613 41.6876L59.4649 41.6834L59.5075 41.6339C59.9081 41.169 60.3087 40.7041 60.71 40.24C60.7223 40.2216 60.7346 40.207 60.7492 40.1915C60.7583 40.1817 60.7684 40.1716 60.78 40.16C61.23 39.66 61.69 39.17 62.19 38.72L62.46 38.51L62.4623 38.5086L62.4692 38.5043C62.5022 38.4837 62.5352 38.463 62.5691 38.4424C62.6141 38.4149 62.6606 38.3875 62.71 38.36C62.73 38.35 62.74 38.34 62.75 38.34C63.0657 38.5101 63.3683 38.6997 63.6684 38.8878C63.739 38.932 63.8095 38.9762 63.88 39.02C64.77 39.6201 65.63 40.24 66.45 40.94C67.6361 42.0049 68.7023 43.1898 69.7653 44.3712L69.7662 44.3721C69.9307 44.5549 70.0952 44.7377 70.26 44.92C71.24 46.06 72.21 47.19 73.15 48.35C73.9074 49.2912 74.654 50.2379 75.4016 51.1859C75.6708 51.5272 75.94 51.8686 76.21 52.21C76.83 53 77.48 53.79 78.19 54.5C78.47 54.78 78.81 55.05 79.17 55.24L79.257 55.2873C79.2052 55.4045 79.1526 55.5217 79.1 55.64C78.97 55.8701 78.85 56.11 78.75 56.35C78.6368 56.6286 78.5388 56.9148 78.4428 57.1953L78.4 57.32C78.2832 57.652 78.1777 57.9802 78.072 58.3092C78.0057 58.5155 77.9394 58.722 77.87 58.93C77.74 59.28 77.6 59.63 77.44 59.97C77.4 60.05 77.35 60.1301 77.3 60.21C77.27 60.2501 77.24 60.2901 77.2 60.34L77.15 60.39C77.14 60.39 77.13 60.4 77.12 60.41C77.11 60.42 77.09 60.4201 77.07 60.43C76.92 60.4801 76.76 60.53 76.61 60.57C76.5544 60.5093 76.5013 60.4487 76.4482 60.388L76.4233 60.3595C76.3796 60.3097 76.3357 60.2599 76.29 60.21C76.0461 59.9241 75.811 59.6328 75.5759 59.3414L75.5746 59.3397C75.251 58.9389 74.9273 58.5378 74.58 58.15C74.2957 57.8358 74.0014 57.534 73.7071 57.2322L73.7053 57.2304C73.4102 56.9277 73.1151 56.6251 72.83 56.31C72.7 56.14 72.56 55.97 72.43 55.79C72.3309 55.6429 72.2337 55.4958 72.1365 55.3489C71.9103 55.0067 71.6849 54.666 71.44 54.33C71.2539 54.0742 71.0543 53.8284 70.8549 53.583C70.7115 53.4064 70.5681 53.23 70.43 53.05C70.08 52.59 69.72 52.1301 69.32 51.71C69.244 51.6297 69.1675 51.5498 69.0909 51.47L68.9683 51.3427C68.7326 51.0981 68.4968 50.8535 68.27 50.6C68.1656 50.47 68.0623 50.3379 67.9586 50.2054L67.9566 50.2028C67.6143 49.7651 67.2686 49.3233 66.87 48.94C66.02 48.13 65.05 47.5401 63.88 47.32C62.8 47.1201 61.67 47.16 60.64 47.55C59.92 47.82 59.29 48.26 58.69 48.73C57.3709 49.7762 56.3161 51.0639 55.26 52.3532C54.923 52.7646 54.5859 53.1761 54.24 53.58C53.59 54.3001 52.92 54.97 52.21 55.62C51.9631 55.8469 51.7129 56.0705 51.4626 56.2941C50.9629 56.7405 50.4631 57.1869 49.99 57.66C49.5829 58.0618 49.1898 58.4749 48.7973 58.8873L48.7946 58.89C48.4457 59.2567 48.0973 59.6228 47.74 59.98C47.0941 60.6259 46.4992 61.3145 45.9083 61.9984L45.76 62.17C45.77 62.17 45.78 62.16 45.78 62.15C45.57 62.3701 45.36 62.59 45.14 62.8C44.7352 63.129 44.3103 63.4299 43.8856 63.7307C43.639 63.9054 43.3925 64.08 43.15 64.26C43.0634 64.3262 42.9765 64.3921 42.8895 64.4579C42.7612 64.5548 42.6325 64.6515 42.5037 64.7482C42.1651 65.0026 41.8257 65.2576 41.49 65.52C40.9835 65.9157 40.4955 66.3275 40.0082 66.7388C39.4855 67.1801 38.9635 67.6207 38.42 68.04C37.2715 68.9288 36.1529 69.8477 35.0344 70.7666L35.033 70.7677L35.03 70.77C33.9 71.71 32.95 72.8 31.99 73.91C31.5 74.43 31 74.92 30.48 75.41C29.98 75.81 29.47 76.2 28.95 76.57C28.6328 76.7722 28.3118 76.9694 27.9908 77.1667C27.2795 77.6038 26.5684 78.0408 25.9 78.53C25.33 78.9601 24.79 79.41 24.25 79.87C23.9374 80.1316 23.637 80.4094 23.3358 80.688C23.1649 80.8461 22.9938 81.0043 22.82 81.16C22.47 81.46 22.1 81.7401 21.72 82.01C21.5312 82.1293 21.3423 82.2387 21.1534 82.348L21.15 82.35C20.94 82.45 20.73 82.5401 20.51 82.62C20.3 82.6801 20.08 82.74 19.87 82.7901C19.57 82.84 19.27 82.8801 18.97 82.9C18.3743 82.9347 17.7737 82.9262 17.175 82.9176H17.1739C16.9087 82.9138 16.6439 82.91 16.38 82.91C15.87 82.91 15.37 82.9 14.87 82.87C14.7655 82.8613 14.6686 82.845 14.5661 82.8278L14.52 82.8201C14.4848 82.8142 14.453 82.8084 14.4226 82.8004C14.4013 82.7949 14.3807 82.7883 14.36 82.78C14.31 82.7601 14.27 82.74 14.22 82.72L14.01 82.6C13.91 82.53 13.82 82.46 13.73 82.39C13.255 81.9501 12.8 81.4951 12.345 81.0401C11.89 80.585 11.435 80.13 10.96 79.6901C10.7046 79.4536 10.4469 79.2194 10.1891 78.9851L10.1871 78.9832C9.49672 78.3556 8.80484 77.7266 8.15002 77.05C7.67002 76.4801 7.22002 75.9 6.79002 75.29C6.40002 74.68 6.01002 74.07 5.65002 73.43C5.62211 73.3804 5.59517 73.3317 5.56859 73.2838C5.50945 73.177 5.45211 73.0735 5.39002 72.97C5.34996 72.8819 5.30668 72.7937 5.26212 72.7056C5.23261 72.6472 5.20254 72.5889 5.17247 72.5305C5.13462 72.457 5.09676 72.3835 5.06002 72.31C4.82002 71.81 4.56002 71.2901 4.36002 70.77C4.36002 70.7401 4.35002 70.71 4.34002 70.67C4.33001 70.64 4.32002 70.59 4.32002 70.55C4.29002 69.8501 4.33002 69.15 4.37002 68.45C4.42818 67.8103 4.51001 67.174 4.59192 66.5371C4.65085 66.0788 4.70981 65.6203 4.76002 65.16C4.83381 64.5413 4.89472 63.9161 4.95554 63.2918L4.95581 63.289C5.00205 62.8145 5.04824 62.3403 5.10002 61.87L5.17359 61.2121C5.2056 61.2848 5.23774 61.3574 5.27001 61.43C6.08001 63.26 7.06001 65 8.08001 66.72C9.07001 68.37 10.09 70 11.12 71.62C11.55 72.29 11.99 72.96 12.47 73.6ZM17.01 73.39C16.73 73.13 16.47 72.8701 16.21 72.59C15.576 71.8628 15.0202 71.092 14.494 70.3345C14.3376 70.0856 14.1808 69.8374 14.0238 69.5893C13.9136 69.4153 13.8033 69.2414 13.6931 69.0676L13.6912 69.0647C12.9798 67.9425 12.269 66.8214 11.59 65.68C11.4759 65.4837 11.3597 65.2854 11.2423 65.0867C11.1026 64.8504 10.9613 64.6137 10.82 64.38C10.7433 64.25 10.6644 64.121 10.5855 63.9921C10.4279 63.7346 10.2699 63.4765 10.13 63.21C10.0285 63.0146 9.92698 62.8186 9.82529 62.6221L9.82415 62.6199C9.52567 62.0435 9.22544 61.4637 8.92001 60.89C8.62001 60.2 8.31001 59.5 8.00001 58.8C7.78934 58.3197 7.61417 57.8323 7.4386 57.3438L7.39595 57.2251L7.34001 57.07C7.09001 56.32 6.85001 55.57 6.62001 54.82C6.66001 54.81 6.69001 54.7901 6.73002 54.77C6.9264 54.665 7.12381 54.5609 7.32132 54.4569L7.32876 54.453C7.99373 54.1028 8.6596 53.7521 9.29001 53.36C9.42153 53.2788 9.55326 53.1977 9.68514 53.1168C9.79961 53.0466 9.9142 52.9765 10.0289 52.9064C10.2291 52.7841 10.4295 52.6621 10.63 52.54C10.8307 52.4178 11.0314 52.2956 11.2319 52.1732C11.4784 52.0226 11.7246 51.8717 11.97 51.72C12.8169 51.1979 13.6502 50.6524 14.4838 50.1067C15.0874 49.7116 15.6911 49.3164 16.3 48.93C18.87 47.2925 21.4461 45.6733 24.0235 44.0534C24.7356 43.6058 25.4478 43.1582 26.16 42.71C27.3513 41.9628 28.5401 41.2131 29.7287 40.4635L29.7618 40.4426L29.7703 40.4373L29.7752 40.4342L29.7776 40.4328C31.9448 39.0659 34.1112 37.6997 36.29 36.35C39.56 34.31 42.83 32.27 46.18 30.38C48.06 29.32 49.94 28.26 51.83 27.21C52.63 26.76 53.43 26.31 54.2 25.83C54.73 25.5 55.23 25.16 55.69 24.75C56.08 24.41 56.37 24.04 56.64 23.6C57.18 22.71 57.2 21.59 56.89 20.62C56.55 19.56 55.7 18.69 54.81 18.05C53.9 17.4 52.88 16.93 51.85 16.51C51.102 16.2079 50.3591 15.9162 49.6139 15.6236L49.5998 15.6181C49.3136 15.5057 49.0272 15.3933 48.74 15.28C47.0269 14.6028 45.3834 13.7867 43.74 12.97L43.1422 12.6343C41.8119 11.8877 40.4846 11.1428 39.18 10.36C40.1994 10.3522 41.2128 10.302 42.2249 10.2519L42.2328 10.2515C42.4085 10.2428 42.5841 10.2341 42.7597 10.2257C42.8698 10.2203 42.9799 10.2151 43.09 10.21C44.1389 10.1583 45.1878 10.0466 46.2327 9.93532C46.6023 9.89595 46.9715 9.85664 47.34 9.82002C48.3017 9.73195 49.2634 9.60066 50.2211 9.46992L50.2295 9.46882L50.2396 9.46736C50.5803 9.42085 50.9205 9.3744 51.26 9.33003C52.6251 9.14851 53.9903 8.92476 55.3554 8.701L55.361 8.70009C55.874 8.61598 56.387 8.53187 56.9 8.45002C57.462 8.35536 58.028 8.24067 58.5929 8.12617C58.9226 8.05934 59.252 7.99263 59.58 7.93001C59.7474 7.89814 59.9148 7.86665 60.0823 7.83516C60.7548 7.70863 61.4274 7.58217 62.1 7.43001C63.7368 7.07051 65.3683 6.70204 66.9989 6.33375L67.0264 6.32753L67.034 6.32588L67.0381 6.32496C69.2497 5.82539 71.4599 5.32612 73.68 4.84999C73.796 4.82966 73.912 4.80903 74.0281 4.78828C74.1771 4.76161 74.3261 4.73463 74.4751 4.70765L74.4873 4.70546C75.5889 4.50618 76.693 4.30647 77.81 4.21003C78.18 4.19001 78.54 4.18001 78.9 4.19001C78.9303 4.19435 78.9625 4.19862 78.9949 4.20295L79.0099 4.20497L79.0186 4.20607L79.0604 4.21174L79.1032 4.2176L79.1164 4.22047C79.139 4.2256 79.1607 4.23152 79.1819 4.23799L79.1956 4.24226C79.2139 4.24806 79.232 4.25404 79.25 4.26002C79.2765 4.27137 79.3015 4.28126 79.3256 4.29084C79.3654 4.30659 79.4027 4.32142 79.44 4.34004C79.4452 4.3426 79.4502 4.34541 79.4551 4.34828C79.4596 4.3509 79.4639 4.35365 79.4682 4.35646C79.4774 4.36244 79.4862 4.36873 79.495 4.37501C79.5034 4.38099 79.5119 4.38704 79.5206 4.39277C79.5299 4.39894 79.5396 4.4048 79.55 4.40999C79.56 4.42 79.57 4.43001 79.59 4.44001L79.62 4.46998L79.71 4.59004C79.73 4.62507 79.7501 4.65761 79.7701 4.69014C79.7901 4.72261 79.8101 4.75502 79.83 4.78999C79.8741 4.88368 79.9182 4.97743 79.9606 5.07283C79.9952 5.15046 80.0286 5.22926 80.06 5.31001C80.13 5.50001 80.18 5.69001 80.22 5.89003C80.32 6.48005 80.38 7.08003 80.42 7.68001C80.415 7.63997 80.4125 7.59999 80.41 7.55995L80.4073 7.51783C80.4054 7.49189 80.4033 7.46595 80.4 7.44001C80.44 8.40004 80.4 9.34999 80.34 10.31V10.32C80.33 10.34 80.33 10.37 80.33 10.39V10.42C80.1632 12.3688 79.8808 14.2946 79.5979 16.2242C79.5585 16.4927 79.5191 16.7613 79.48 17.03C79.3006 18.2858 79.1113 19.5416 78.9219 20.7974L78.9214 20.8009L78.92 20.81C78.73 22.04 78.54 23.27 78.38 24.5C78.3238 24.9432 78.261 25.3865 78.1981 25.8301C78.071 26.7276 77.9436 27.6266 77.87 28.53C77.8498 28.7712 77.8289 29.0123 77.8077 29.2534C77.7888 29.4676 77.7697 29.6818 77.7506 29.896L77.7494 29.9088C77.6091 31.4797 77.4687 33.0518 77.43 34.63L77.37 36.79C77.3667 36.9034 77.3611 37.0168 77.3556 37.1301C77.3444 37.3568 77.3333 37.5834 77.34 37.81C77.38 38.9 77.42 39.98 77.46 41.06C77.49 41.92 77.57 42.75 77.66 43.61C77.678 43.7794 77.6954 43.9489 77.7128 44.1182C77.7918 44.8885 77.8706 45.6576 78.01 46.42L78.0792 46.7966C78.2449 47.7009 78.4105 48.6043 78.63 49.5L78.66 49.62C78.4436 49.3477 78.2271 49.075 78.0106 48.8021C77.0265 47.5623 76.04 46.3195 75.04 45.09C73.9789 43.7808 72.8446 42.5301 71.7122 41.2816C71.5213 41.0711 71.3305 40.8607 71.14 40.65C69.76 39.1101 68.21 37.72 66.5 36.56C66.04 36.25 65.57 35.94 65.1 35.64C64.32 35.14 63.42 34.72 62.46 34.84C61.36 34.9801 60.4 35.61 59.61 36.36C58.76 37.17 58 38.04 57.24 38.93C56.62 39.64 56.01 40.3601 55.4 41.08C54.12 42.52 52.82 43.96 51.52 45.38C50.42 46.58 49.29 47.76 48.12 48.9C46.59 50.38 45.06 51.84 43.5 53.29C42.493 54.2202 41.4682 55.1267 40.4393 56.0369L39.6202 56.7622L39.6094 56.7719L39.5918 56.7874C38.9712 57.3316 38.3502 57.8757 37.72 58.42C36.21 59.74 34.69 61.0401 33.17 62.34C32.5198 62.8903 31.8595 63.428 31.1993 63.9656C30.5395 64.5029 29.8798 65.0402 29.23 65.59C27.57 66.9801 25.91 68.36 24.22 69.72C22.88 70.8 21.47 71.8001 20.04 72.77C19.65 73.01 19.26 73.25 18.85 73.46C18.62 73.57 18.39 73.6701 18.15 73.76C18.08 73.78 18 73.8 17.93 73.82C17.9157 73.82 17.9013 73.8223 17.8881 73.8247L17.8781 73.8266C17.8725 73.8275 17.8672 73.8284 17.8623 73.8291C17.8579 73.8297 17.8538 73.83 17.85 73.83H17.81C17.8012 73.83 17.7924 73.8292 17.7836 73.828L17.7674 73.8254C17.7516 73.8228 17.7358 73.82 17.72 73.82C17.7111 73.8156 17.7023 73.8111 17.6934 73.8076C17.6823 73.8031 17.6711 73.8 17.66 73.8C17.62 73.79 17.59 73.78 17.55 73.76C17.5002 73.7324 17.4535 73.7047 17.4082 73.677C17.3723 73.6551 17.3372 73.6332 17.3021 73.6113L17.3 73.61C17.2 73.54 17.1 73.46 17.01 73.39Z"
        fill="currentColor"
      />
      <path
        d="M73.72 62.7L73.71 62.69C73.71 62.69 73.71 62.6943 73.7128 62.6972C73.7143 62.6988 73.7166 62.7 73.72 62.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Arrow4(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width="150"
      height="82"
      viewBox="0 0 150 82"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M67.616 0.147978C57.1498 0.781251 46.3786 4.08834 38.3061 9.10762C31.9231 13.0949 25.4463 19.3807 20.0724 26.7689C15.5199 33.0312 11.249 40.1849 8.76149 45.6967C6.18015 51.4431 4.37323 57.0487 2.26123 65.7738C-0.226243 76.0234 -0.531333 79.0491 0.712402 80.8785C1.1348 81.5118 1.36949 81.6525 2.02656 81.6525H2.84789L3.01215 79.6589C3.15295 77.6887 3.36414 76.774 6.34441 66.0552C8.85535 56.9314 10.7796 51.7714 14.018 45.4152C19.5796 34.4854 27.9103 23.626 35.2554 17.8092C42.5066 12.0629 51.1658 8.5447 61.984 6.90288C63.3216 6.71525 66.1845 6.59798 69.8453 6.59798C76.1813 6.62143 78.9269 6.90288 83.8315 8.09907C93.8987 10.5852 100.352 14.3614 113.259 25.3382C115.817 27.5194 121.003 32.4918 121.003 32.7732C121.003 32.8436 120.346 32.7732 119.548 32.6091C117.389 32.1634 116.286 32.2103 115.136 32.8202C113.939 33.4534 113.024 34.9311 113.024 36.2211C113.024 38.1678 114.291 39.5985 117.131 40.8651C117.905 41.1934 121.918 43.1636 126.048 45.2276C134.332 49.3791 135.857 50.0358 139.494 51.0443C143.906 52.2874 146.511 51.9356 148.271 49.8951C149.82 48.0891 150.031 45.6498 148.858 43.2574C148.506 42.5772 147.027 40.4898 145.549 38.6134C142.404 34.6496 141.7 33.5472 140.433 30.592C139.236 27.8009 138.18 24.0951 136.843 18.0438C134.543 7.44234 134.684 7.95834 134.027 8.61507C133.229 9.41252 132.032 17.8796 132.032 22.7112C132.032 26.1122 132.29 28.1996 133.088 31.4832C133.393 32.7732 133.628 33.8287 133.604 33.8522C133.581 33.8756 132.76 32.8202 131.797 31.5067C127.503 25.69 116.826 16.3551 107.275 10.0927C99.4838 5.00307 92.6784 2.35271 83.4091 0.851615C78.3872 0.0307056 73.248 -0.180385 67.616 0.147978Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Arrow11(props: SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width="144"
      height="61"
      viewBox="0 0 144 61"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M68.9434 0.229236C58.3864 1.33176 45.4598 5.76533 36.6623 11.2545C33.1902 13.4126 29.155 16.3449 25.5421 19.3241C21.6478 22.5378 13.859 30.279 11.3487 33.4458C6.60979 39.3807 2.62156 46.6527 0.627451 52.9394C-0.146734 55.426 -0.217114 58.4286 0.486691 59.9533C1.21396 61.5719 1.6597 61.2904 1.6597 59.2496C1.6597 56.7865 2.3635 54.6049 4.56876 50.0541C6.96169 45.1279 8.55699 42.4771 11.513 38.5596C17.6361 30.4432 28.9673 20.5204 38.8441 14.6794C45.7413 10.5742 54.5389 7.47778 63.9464 5.81226C67.5124 5.17889 75.7938 4.94431 80.1809 5.3431C85.3421 5.81226 91.9579 7.40741 96.7672 9.28405C101.623 11.1842 107.559 14.4448 112.04 17.6586C114.925 19.6994 121.518 24.8836 121.541 25.0947C121.541 25.1651 120.087 25.6108 118.304 26.08C114.198 27.1356 112.626 27.7455 111.406 28.6604C110.139 29.6456 109.6 30.3963 109.436 31.4519C109.295 32.2025 109.389 32.4136 109.975 33.0236C111.125 34.173 111.993 34.173 120.814 33.0236C128.368 32.0618 128.978 32.0148 135.054 32.0148L141.412 31.9914L142.256 31.3346C143.383 30.4901 143.828 29.5752 143.828 28.2147C143.828 26.643 143.078 25.4701 141.154 24.0861C140.262 23.4292 138.667 22.139 137.635 21.2007C133.365 17.424 129.048 13.9287 127.289 12.8497C123.207 10.3162 120.204 10.1989 118.139 12.5212L117.436 13.3188L114.503 11.4422C105.119 5.48384 94.8904 1.7071 84.3802 0.323074C81.4008 -0.0522541 72.2279 -0.122634 68.9434 0.229236Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function HomePage({
  locale = "en",
  communityTemplates = [],
}: HomePageProps) {
  const copy = localeCopy[locale];
  const valueFeatures = [
    {
      title: copy.value.aiTitle,
      description: copy.value.aiDescription,
    },
    {
      title: copy.value.compatibilityTitle,
      description: copy.value.compatibilityDescription,
    },
    {
      title: copy.value.brandTitle,
      description: copy.value.brandDescription,
    },
    {
      title: copy.value.workflowTitle,
      description: copy.value.workflowDescription,
    },
    {
      title: copy.value.integrationsTitle,
      description: copy.value.integrationsDescription,
    },
    {
      title: copy.value.qaTitle,
      description: copy.value.qaDescription,
    },
  ];
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
  const localizedTemplateCards: TemplateShowcaseCard[] =
    communityTemplateCards.length > 0
      ? communityTemplateCards
      : localizedFallbackTemplateCards;
  const templateMasonryColumnCount = useResponsiveMasonryColumnCount(
    localizedTemplateCards.length,
    5,
  );
  const templateMasonryColumns =
    templateMasonryColumnCount > 0
      ? buildTemplateMasonryColumns(
          localizedTemplateCards,
          templateMasonryColumnCount,
        )
      : [];
  const [prompt, setPrompt] = useState("");
  const [promptOptionValues, setPromptOptionValues] = useState<
    Record<string, string>
  >({});
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
  const hasPrompt = prompt.trim().length > 0;
  const toneLabel = copy.promptOptions[0]?.label;
  const lengthLabel = copy.promptOptions[1]?.label;
  const selectedTone = toneLabel ? promptOptionValues[toneLabel] : undefined;
  const selectedLength = lengthLabel
    ? promptOptionValues[lengthLabel]
    : undefined;
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
  // already-signed-in visitors straight into the app (carrying their prompt).
  const handlePromptSubmit = () => {
    if (!signedIn) {
      openAuthDialog();
      return;
    }

    const trimmed = prompt.trim();
    window.location.assign(
      trimmed
        ? clientPromptUrl(trimmed, selectedTone, selectedLength)
        : clientHomeUrl(),
    );
  };

  const openTemplatePreview = (template: TemplateShowcaseCard) =>
    setPreviewTemplate(template);

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

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handlePromptSubmit();
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
    const incomingTone = nextSearch?.get("tone");
    const incomingLength = nextSearch?.get("length");

    if (incomingPrompt) setPrompt(incomingPrompt);
    if (incomingTone || incomingLength) {
      setPromptOptionValues((current) => ({
        ...current,
        ...(toneLabel && incomingTone ? { [toneLabel]: incomingTone } : {}),
        ...(lengthLabel && incomingLength
          ? { [lengthLabel]: incomingLength }
          : {}),
      }));
    }

    setAuthDialogOpen(true);
  }, [lengthLabel, toneLabel]);

  return (
    <>
      <AuthDialog
        open={authDialogOpen}
        onClose={closeAuthDialog}
        locale={locale}
        prompt={prompt}
        tone={selectedTone}
        length={selectedLength}
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
          <div className="relative isolate mx-auto flex min-h-[calc(100svh-1rem)] w-full max-w-[calc(100vw-1rem)] flex-col items-center justify-start gap-7 overflow-visible rounded-2xl px-4 pt-32 font-ibm-plex-sans shadow-[0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.14)] sm:max-w-[calc(100vw-1.5rem)] sm:gap-9 sm:px-6 sm:pt-40 lg:min-h-[150vh] lg:pt-65 2xl:pt-75 xl:max-w-[calc(100vw-2rem)]">
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
                  placeholder={hasPrompt ? "" : heroPlaceholder}
                  className="madoo-prompt-textarea mr-3 max-h-80 min-h-24 w-[calc(100%-0.75rem)] resize-none rounded-t-3xl bg-transparent px-5 pr-10 pt-5 text-sm text-[#101114] outline-none placeholder:text-zinc-500"
                />

                <div className="flex flex-col gap-3 px-3.5 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <AttachMenu
                      label={copy.hero.addAttachment}
                      onUploadFile={openFilePicker}
                      onUploadImage={openImagePicker}
                    />

                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      {copy.promptOptions.map((option) => (
                        <Select
                          key={option.label}
                          value={promptOptionValues[option.label] ?? ""}
                          options={option.options}
                          placeholder={option.label}
                          menuTitle={option.label}
                          menuWidth={option.menuWidth}
                          size="sm"
                          variant="ghost"
                          onChange={(value) =>
                            setPromptOptionValues((current) => ({
                              ...current,
                              [option.label]: value,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={dictation.toggle}
                      aria-pressed={dictation.isListening}
                      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-[background,color] duration-(--duration-fast) ease-out ${
                        dictation.isListening
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
                      onClick={handlePromptSubmit}
                      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-4 text-xs text-white transition ${
                        hasPrompt
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

        <section className="madoo-paper-section relative z-10 w-full px-4 pb-16 pt-20 sm:px-8 sm:pb-24 sm:pt-32 lg:pt-64 xl:px-0">
          <div className="mx-auto w-full max-w-7xl font-ibm-plex-sans">
            <div className="flex w-full flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b63ff]">
                  {copy.value.eyebrow}
                </p>
                <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-[0.98] tracking-normal text-[#171717] sm:text-5xl">
                  {copy.value.title}
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f6961]">
                  {copy.value.description}
                </p>
              </div>

              <div className="madoo-paper-border w-full rounded-full bg-white px-4 py-2 text-sm font-medium text-[#071b38] sm:w-fit">
                {copy.value.status}
              </div>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-12">
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
                {valueFeatures.map((feature, index) => {
                  const Icon =
                    workflowSteps[index % workflowSteps.length]?.icon ??
                    AiIdeaIcon;

                  return (
                    <article
                      key={feature.title}
                      className="madoo-paper-border madoo-paper-border-hover group min-h-47.5 rounded-lg bg-white p-5 transition"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3faff] text-[#071b38] transition group-hover:bg-[rgb(var(--rule-rgb)/0.06)]">
                        <HugeiconsIcon
                          icon={Icon}
                          size={20}
                          strokeWidth={1.6}
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="mt-6 text-[15px] font-semibold leading-tight text-[#171717]">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#6f6961]">
                        {feature.description}
                      </p>
                    </article>
                  );
                })}
              </div>

              <div className="madoo-paper-border relative overflow-hidden rounded-lg bg-[#101114] p-5 text-white lg:col-span-5">
                <div
                  className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgba(91,99,255,0.45),rgba(79,209,197,0.28),rgba(255,255,255,0))]"
                  aria-hidden="true"
                />

                <div className="relative">
                  <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                    <div>
                      <h3 className="text-lg font-semibold leading-tight">
                        {copy.value.compatibilityTitle}
                      </h3>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
                        {copy.value.compatibilityDescription}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/10 px-3 py-2 text-left shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.10)] sm:text-right">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                        QA
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {copy.value.readyLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5">
                    {copy.value.clients.map((client) => (
                      <div
                        key={client}
                        className="rounded-lg bg-white/6 px-3 py-3 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.10)]"
                      >
                        <div className="mb-3 h-1.5 w-8 rounded-full bg-[#7dd3fc]" />
                        <p className="text-xs font-medium text-white">
                          {client}
                        </p>
                        <p className="mt-1 text-[11px] text-white/45">
                          {copy.value.previewLabel}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-lg bg-white/6 p-4 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.10)]">
                    <div className="flex flex-wrap items-center gap-2">
                      {copy.value.flow.map((step, index) => (
                        <div key={step} className="flex items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#101114]">
                            {step}
                          </span>
                          {index < copy.value.flow.length - 1 ? (
                            <span
                              className="hidden h-px w-5 bg-white/25 sm:block"
                              aria-hidden="true"
                            />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_1.1fr]">
                    <div className="rounded-lg bg-white/6 p-4 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.10)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                        {copy.value.brandTitle}
                      </p>
                      <div className="mt-4 flex gap-2">
                        {["#071b38", "#5b63ff", "#4fd1c5", "#ffffff"].map(
                          (color) => (
                            <span
                              key={color}
                              className="h-8 w-8 rounded-full shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.20)]"
                              style={{ backgroundColor: color }}
                            />
                          ),
                        )}
                      </div>
                      <div className="mt-4 space-y-2">
                        {copy.value.controls.slice(0, 3).map((control) => (
                          <div
                            key={control}
                            className="h-2 rounded-full bg-white/15"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white/6 p-4 shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.10)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                        {copy.value.integrationsTitle}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {exportProviders.slice(0, 6).map((provider, index) => (
                          <div
                            key={provider.name}
                            className="flex items-center gap-2 rounded-lg bg-white px-2 py-2"
                          >
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
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
                                className="h-4 w-4 object-contain"
                                loading="lazy"
                              />
                            </span>
                            <span className="truncate text-[11px] font-semibold text-[#101114]">
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
          </div>
        </section>

        <section
          id="templates"
          className="madoo-paper-section madoo-paper-templates relative z-10 my-24 mb-28 w-full px-4 sm:my-36 sm:mb-44 sm:px-8 lg:my-56 lg:mb-80 xl:px-0"
        >
          <div className="mx-auto w-full max-w-7xl">
            <div className="flex w-full flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <h2 className="font-ibm-plex-sans text-3xl font-semibold text-[#171717] sm:text-5xl">
                  {copy.templates.title}
                </h2>
                <h4 className="mt-3 max-w-xl font-ibm-plex-sans text-zinc-600">
                  {copy.templates.description}
                </h4>
              </div>
            </div>

            {templateMasonryColumnCount === 0 ? (
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {localizedTemplateCards.map(renderTemplateCard)}
              </div>
            ) : (
              <div
                className="mt-10 grid justify-start gap-4"
                style={{
                  // Masonry decides the real width; this max is only a guard so a
                  // small gallery (e.g. 2 templates) never stretches a card across
                  // half the screen. With more cards the columns shrink below the
                  // cap to fit (min 0), so the cap is a no-op then.
                  gridTemplateColumns: `repeat(${templateMasonryColumns.length}, minmax(0, 480px))`,
                }}
              >
                {templateMasonryColumns.map((column, columnIndex) => (
                  <div
                    key={columnIndex}
                    className="flex min-w-0 flex-col gap-4"
                  >
                    {column.entries.map(({ index, template }) =>
                      renderTemplateCard(template, index),
                    )}
                  </div>
                ))}
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
                  placeholder={hasPrompt ? "" : ctaPlaceholder}
                  className="madoo-prompt-textarea mr-3 max-h-56 min-h-20 w-[calc(100%-0.75rem)] resize-none rounded-t-3xl bg-transparent px-5 pr-10 pt-5 text-sm text-[#101114] outline-none placeholder:text-zinc-500"
                />

                <div className="flex flex-col gap-3 px-3.5 pb-3 sm:flex-row sm:items-center sm:justify-between">
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
                      className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-[background,color] duration-(--duration-fast) ease-out ${
                        dictation.isListening
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
                      onClick={handlePromptSubmit}
                      className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-full px-4 text-xs text-white transition ${
                        hasPrompt
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

type PromptAttachment = {
  id: string;
  file: File;
  /** Object URL for image previews; null for non-image files. */
  url: string | null;
};

function AttachMenu({
  label,
  onUploadFile,
  onUploadImage,
}: {
  label: string;
  onUploadFile: () => void;
  onUploadImage: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dropdown open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        data-state={open ? "open" : "closed"}
        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#101114] transition-[background,color] duration-(--duration-fast) ease-out hover:bg-[rgb(var(--rule-rgb)/0.06)] data-[state=open]:bg-[rgb(var(--rule-rgb)/0.06)]"
      >
        <HugeiconsIcon
          icon={Add01Icon}
          size={18}
          strokeWidth={1.4}
          aria-hidden="true"
        />
      </button>

      <DropdownContent
        side="bottom"
        align="start"
        className="min-w-48 rounded-lg p-1.5 shadow-madoo-border!"
      >
        <AttachMenuItem
          icon={Image01Icon}
          label="Upload image"
          onSelect={onUploadImage}
        />
        <AttachMenuItem
          icon={Attachment01Icon}
          label="Upload file"
          onSelect={onUploadFile}
        />
      </DropdownContent>
    </Dropdown>
  );
}

function AttachMenuItem({
  icon,
  label,
  onSelect,
}: {
  icon: typeof Image01Icon;
  label: string;
  onSelect: () => void;
}) {
  return (
    <DropdownItem
      onSelect={onSelect}
      className="rounded-lg px-2.5 py-[7px] text-sm text-[#101114] hover:bg-(--surface-2)! focus-visible:bg-(--surface-2)!"
    >
      <span className="flex items-center gap-2">
        <HugeiconsIcon
          icon={icon}
          size={15}
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <span>{label}</span>
      </span>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={13}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </DropdownItem>
  );
}

function AttachmentPreviewList({
  attachments,
  className,
  onRemove,
}: {
  attachments: PromptAttachment[];
  className?: string;
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) return null;

  return (
    <div className={cx("flex flex-wrap gap-2", className)}>
      {attachments.map((attachment) =>
        attachment.url ? (
          <div
            key={attachment.id}
            className="group relative h-16 w-16 overflow-hidden rounded-lg shadow-madoo-border"
          >
            <img
              src={attachment.url}
              alt={attachment.file.name}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              aria-label={`Remove ${attachment.file.name}`}
              className="absolute right-1 top-1 inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition hover:bg-black group-hover:opacity-100"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={11}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </div>
        ) : (
          <div
            key={attachment.id}
            className="flex max-w-56 items-center gap-2 rounded-lg bg-white px-2.5 py-2 shadow-madoo-border"
          >
            <HugeiconsIcon
              icon={Attachment01Icon}
              size={15}
              strokeWidth={1.8}
              className="shrink-0 text-[#101114]"
              aria-hidden="true"
            />
            <span className="min-w-0 truncate text-xs text-[#101114]">
              {attachment.file.name}
            </span>
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              aria-label={`Remove ${attachment.file.name}`}
              className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-[#101114]"
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={12}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
          </div>
        ),
      )}
    </div>
  );
}
