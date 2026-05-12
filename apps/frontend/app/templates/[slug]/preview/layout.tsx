import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Template Preview",
  robots: { index: false, follow: false },
};

export default function TemplatePreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
