import { LoginModal } from "@/components/auth/LoginModal";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { AppShell } from "@/components/shell/AppShell";
import "@madoo/ui/tokens.css";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const siteTitle = "Madoo AI — Generate beautiful emails with AI";
const siteDescription =
  "Describe it in plain words. Madoo AI writes, designs, and ships it.";

const metadataBaseUrl = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
})();

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 516,
        alt: "Madoo AI — create emails from a simple prompt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="warm"
      data-density="cozy"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrains.variable}`}
    >
      <body>
        <QueryProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
            <LoginModal />
          </ToastProvider>
        </QueryProvider>
      </body>

      <Analytics />
    </html>
  );
}
