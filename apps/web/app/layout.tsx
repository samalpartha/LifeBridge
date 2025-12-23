import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeBridge - AI-Powered Cross-Border Mobility Assistant",
  description: "Transform documents into actionable plans. Upload docs, get checklists, timelines, and risk assessments with AI-powered evidence linking."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient">LifeBridge</h1>
                  <p className="text-xs text-gray-500">AI-Powered Mobility Assistant</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <a href="https://github.com/yourusername/lifebridge" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <span className="badge badge-success">Open Source</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="mt-16 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">LifeBridge</h3>
                <p className="text-sm text-gray-600">Open source AI-powered assistant for cross-border mobility. Transform documents into actionable insights.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Links</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="http://localhost:8000/docs" target="_blank" className="hover:text-blue-600 transition-colors">API Documentation</a></li>
                  <li><a href="https://github.com/yourusername/lifebridge" target="_blank" className="hover:text-blue-600 transition-colors">GitHub Repository</a></li>
                  <li><a href="#" className="hover:text-blue-600 transition-colors">Report Issue</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-3">License</h3>
                <p className="text-sm text-gray-600">MIT License - Free to use, modify, and distribute</p>
                <p className="text-xs text-gray-500 mt-4">Built with ❤️ for the VisaVerse AI Hackathon</p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
