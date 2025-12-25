import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/auth-context";
import { LayoutWrapper } from "./components/LayoutWrapper";

export const metadata: Metadata = {
  title: "LifeBridge - AI-Powered Cross-Border Mobility Assistant",
  description: "Transform documents into actionable plans. Upload docs, get checklists, timelines, and risk assessments with AI-powered evidence linking."
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans bg-gray-50" suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
            <Toaster position="top-center" />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
