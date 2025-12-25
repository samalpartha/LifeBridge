"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import SamaritanChat from "./SamaritanChat";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Check if path starts with /login or /signup to handle sub-routes if any
    const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup");

    return (
        <div className="flex min-h-screen">
            {!isAuthPage && <Sidebar />}

            <main className={`flex-1 min-h-screen flex flex-col relative ${!isAuthPage ? "ml-64" : "w-full"}`}>
                {/* Main scrollable area */}
                <div className={`flex-1 overflow-y-auto ${!isAuthPage ? "p-8" : ""}`}>
                    {children}
                </div>

                {!isAuthPage && <SamaritanChat />}
            </main>
        </div>
    );
}
