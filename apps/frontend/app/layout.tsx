import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { AuthProvider } from "@/components/auth/AuthContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceContext";

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

export const metadata: Metadata = {
  title: "Madoo AI — Generate beautiful emails with AI",
  description: "Describe it in plain words. Madoo AI writes, designs, and ships it.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="warm"
      data-density="cozy"
      className={`${inter.variable} ${instrumentSerif.variable} ${jetbrains.variable}`}
    >
      <body>
        <QueryProvider>
          <AuthProvider>
            <WorkspaceProvider>
              <AppShell>{children}</AppShell>
              <LoginModal />
            </WorkspaceProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
