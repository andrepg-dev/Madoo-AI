import type { Metadata, Viewport } from "next";
import { Figtree, IBM_Plex_Sans, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "@madoo/design-system/tokens.css";
import { LandingFooter } from "../components/LandingFooter";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-figtree-next",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://madooai.com"),
  title: "Madoo | AI Email Builder",
  description: "Export your email templates design to MailChimp or any provider of your preference. ",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "64x64" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${figtree.variable} ${ibmPlexSans.variable}`}
    >
      <body className={`${inter.className} bg-madoo-page`}>
        <div className="relative min-h-screen w-full bg-madoo-page">
          <div className="relative z-10">
            {children}
            <LandingFooter />
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
