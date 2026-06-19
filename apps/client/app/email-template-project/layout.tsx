import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>{children}</>
  )
}
