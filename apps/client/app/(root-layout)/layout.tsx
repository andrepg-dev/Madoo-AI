import { ClientShell } from "@/components/shell/ClientShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ClientShell>{children}</ClientShell>
}
