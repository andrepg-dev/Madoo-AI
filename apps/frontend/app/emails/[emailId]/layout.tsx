import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Editor",
  robots: { index: false, follow: false },
};

export default function EmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
