import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/auth-context";
import { LayoutWrapper } from "./components/LayoutWrapper";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

export const metadata: Metadata = {
  title: "LifeBridge Crisis Corridor",
  description:
    "Production-grade crisis navigation and reunification platform with multi-agent safety recommendations, verified havens, and offline-aware workflows.",
};

import { Toaster } from "react-hot-toast";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${jetBrainsMono.variable} bg-gray-50`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <AuthProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
            <Toaster position="top-center" />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
