"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    FolderOpen,
    Map,
    BookOpen,
    History,
    Settings,
    LogOut,
    Globe
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "../contexts/auth-context";
import { useLanguage } from "../contexts/LanguageContext";

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { t } = useLanguage();

    const navItems = [
        { name: t("sidebar.dashboard"), href: "/", icon: LayoutDashboard },
        { name: t("sidebar.tracker"), href: "/tracker", icon: Globe },
        { name: t("sidebar.vault"), href: "/vault", icon: FolderOpen },
        { name: t("sidebar.attorneys"), href: "/attorneys", icon: UserGroupIcon },
        { name: t("sidebar.resources"), href: "/resources", icon: BookOpen },
        { name: t("sidebar.embassy"), href: "/map", icon: Map },
    ];

    // Helper for specialized icons not in Lucide default set being used
    function UserGroupIcon(props: any) {
        // ... existing SVG ...
        return (
            <svg
                {...props}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        );
    }

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-50">

            {/* Brand */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                    <Image
                        src="/icon.png"
                        alt="LifeBridge Logo"
                        width={40}
                        height={40}
                        className="object-cover"
                    />
                </div>
                <div>
                    <h1 className="font-bold text-gray-900 text-lg">LifeBridge</h1>
                    <p className="text-xs text-gray-500">Mobility Assistant</p>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.name}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-gray-200 space-y-4">

                {/* Language Switcher */}
                <div className="px-3">
                    <LanguageSwitcher />
                </div>

                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                        {user?.email?.[0].toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.email?.split('@')[0] || "Guest User"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">Google Account</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-gray-500 hover:text-red-600 px-3 py-2 w-full rounded-lg text-sm transition-colors"
                >
                    <LogOut size={16} />
                    Log Out
                </button>
            </div>
        </div>
    );
}
