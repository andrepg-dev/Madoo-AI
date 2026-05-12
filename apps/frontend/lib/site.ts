export const siteConfig = {
  name: "Madoo AI",
  title: "AI Email Template Generator for Marketing Teams | Madoo AI",
  description:
    "Create responsive HTML email templates, edit copy with AI, manage contacts, verify sending domains, and launch email campaigns from one workspace.",
  url: getSiteUrl(),
  ogImage: "/og-image.png",
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
