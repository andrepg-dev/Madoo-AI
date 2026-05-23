export const siteConfig = {
  name: "Madoo AI",
  title: "AI Email Template Generator for Marketing Teams | Madoo AI",
  description:
    "Vibe-code responsive HTML email templates with AI. Describe your campaign, preview polished designs, and launch send-ready marketing emails faster.",
  shortDescription: "AI email template generator for send-ready marketing emails.",
  url: getSiteUrl(),
  ogImage: "/og-image.png",
  locale: "en_US" as const,
  type: "website" as const,
  keywords: [
    "AI email template generator",
    "generative AI email templates",
    "HTML email generator",
    "email campaign builder",
    "responsive email templates",
    "AI email marketing tool",
    "newsletter template generator",
    "email design software",
    "marketing email templates",
    "Vibe code email templates"
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
