import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sending Domains",
  robots: { index: false, follow: false },
};

export default function DomainLayout({ children }: { children: React.ReactNode }) {
  return children;
}
