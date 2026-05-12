import { HomeScreen } from "@/components/home/HomeScreen";
import { productFaq, productFeatures, productUseCases } from "@/lib/product-marketing";
import { siteConfig } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/madoo-transparent.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteConfig.url,
    image: `${siteConfig.url}${siteConfig.ogImage}`,
    description: siteConfig.description,
    featureList: productFeatures.map((feature) => feature.title),
    audience: {
      "@type": "Audience",
      audienceType: "Marketing teams, SaaS founders, ecommerce teams, agencies",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: siteConfig.url,
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: productFaq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Madoo AI email marketing use cases",
    itemListElement: productUseCases.map((name, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
    })),
  },
];

export default function Page() {
  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <HomeScreen brand="Madoo AI" />
    </>
  );
}
