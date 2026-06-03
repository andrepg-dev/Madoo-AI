import { notFound } from "next/navigation";
import HomePage from "../page";

const locales = ["en", "es"] as const;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (locale !== "en" && locale !== "es") {
    notFound();
  }

  return <HomePage locale={locale} />;
}
