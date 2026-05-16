export const siteConfig = {
  name: "Madoo AI",
  title: "AI Email Template Generator for Marketing Teams | Madoo AI",
  description:
    "Create responsive HTML email templates, edit copy with AI, manage contacts, verify sending domains, and launch email campaigns from one workspace.",
  shortDescription: "AI email template generator and campaign workspace for marketing teams.",
  url: getSiteUrl(),
  ogImage: "/og-image.png",
  locale: "en_US" as const,
  type: "website" as const,
  keywords: [
    "AI email template generator",
    "HTML email generator",
    "email campaign builder",
    "responsive email templates",
    "AI email marketing tool",
    "newsletter template generator",
    "email design software",
    "marketing email templates",
  ],
};

export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function getCanonicalUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, siteConfig.url).toString();
}

export const siteVerification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION,
  yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION,
};
