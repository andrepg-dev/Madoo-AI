import { getCanonicalUrl, siteConfig } from "@/lib/site";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.shortDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f5efe6",
    theme_color: "#f5efe6",
    categories: ["business", "marketing", "productivity", "software"],
    icons: [
      {
        src: getCanonicalUrl("/icon.png"),
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
