import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: "https://madoo.ai", lastModified, changeFrequency: "weekly", priority: 1 },
    { url: "https://madoo.ai/en", lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://madoo.ai/es", lastModified, changeFrequency: "weekly", priority: 0.9 },
    { url: "https://madoo.ai/pricing", lastModified, changeFrequency: "weekly", priority: 0.8 },
  ];
}
