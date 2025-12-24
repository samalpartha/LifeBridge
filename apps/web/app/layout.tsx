import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/auth-context";
import { Sidebar } from "./components/Sidebar";
import SamaritanChat from "./components/SamaritanChat";

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
            <div className="flex min-h-screen">
              <Sidebar />

              <main className="flex-1 ml-64 min-h-screen flex flex-col relative">

                {/* Top Header (Optional for Search/Notifications if needed, basically empty for now or breadcrumbs) */}
                {/* Main scrollable area */}
                <div className="flex-1 p-8 overflow-y-auto">
                  {children}
                </div>

                <SamaritanChat />
              </main>
            </div>
            <Toaster position="top-center" />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
