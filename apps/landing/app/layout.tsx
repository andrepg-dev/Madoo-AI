import type { Metadata, Viewport } from "next";
import { Figtree, IBM_Plex_Sans, Instrument_Serif, Inter } from "next/font/google";
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

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://madooai.com"),
  title: "Madoo | AI Email Builder",
  description: "Export your email templates design to MailChimp or any provider of your preference.",
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
      className={`${inter.variable} ${figtree.variable} ${ibmPlexSans.variable} ${instrumentSerif.variable}`}
    >
      <body className={`${inter.className} bg-madoo-paper`}>
        <div className="relative min-h-screen w-full bg-madoo-paper">
          <div
            className="pointer-events-none fixed inset-0 z-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 2px, var(--color-madoo-surface) 2px, var(--color-madoo-surface) 4px)",
            }}
            aria-hidden="true"
          />
          <div className="relative z-10">
            {children}
            <LandingFooter />
          </div>
        </div>
      </body>
    </html>
  );
}
