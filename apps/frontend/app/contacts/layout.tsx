import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacts",
  robots: { index: false, follow: false },
};

export default function ContactsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
