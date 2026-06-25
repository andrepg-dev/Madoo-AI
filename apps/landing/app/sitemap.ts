import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: "https://madoo.ai", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: "https://madoo.ai/en", lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://madoo.ai/es", lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://madoo.ai/pricing", lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: "https://madoo.ai/privacy", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://madoo.ai/es/privacy", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://madoo.ai/terms", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://madoo.ai/es/terms", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://madoo.ai/security", lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: "https://madoo.ai/es/security", lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
