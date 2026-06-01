export const siteConfig = {
  name: "Madoo AI",
  title: "Madoo — AI Email Generator for Better Email Templates",
  description:
    "Generate better email templates with AI. Draft, preview, edit, and export responsive emails from one workspace.",
  url: getSiteUrl(),
  ogImage: "/og-image.png",
  keywords: [
    "AI email generator",
    "AI email templates",
    "AI email writer",
    "HTML email generator",
    "email template generator",
    "responsive email templates",
    "email templates",
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
