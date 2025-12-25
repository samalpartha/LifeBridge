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
    Globe,
    FileText,
    Calendar,
    HelpCircle
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "../contexts/auth-context";
import { useLanguage } from "../contexts/LanguageContext";

// Helper for specialized icons not in Lucide default set being used
function UserGroupIcon(props: any) {
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

export function Sidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const { t } = useLanguage();

    // Grouped Navigation
    const navGroups = [
        {
            title: "Case Workspace",
            items: [
                { name: t("sidebar.dashboard") || "Dashboard", href: "/", icon: LayoutDashboard },
                { name: "My Cases", href: "/tracker/cases", icon: FolderOpen },
                { name: "Documents", href: "/vault", icon: FileText },
                { name: "Tasks", href: "/tracker/tasks", icon: Calendar },
                { name: "Timeline", href: "/tracker/history/travel", icon: History },
            ]
        },
        {
            title: "Guidance",
            items: [
                { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
                { name: t("sidebar.attorneys") || "Find Attorneys", href: "/attorneys", icon: UserGroupIcon },
                { name: t("sidebar.embassy") || "Embassy Finder", href: "/map", icon: Map },
                { name: "Help", href: "/help", icon: HelpCircle },
            ]
        }
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-50">

            {/* Brand */}
            <div className="p-6 border-b border-gray-100">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
                </Link>
                {/* Language Switcher - Moved below logo */}
                <div className="mt-4">
                    <LanguageSwitcher />
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                {navGroups.map((group) => (
                    <div key={group.title}>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <div
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                }`}
                                        >
                                            <item.icon size={18} />
                                            {item.name}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-gray-200 space-y-4">
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

                <div className="px-3 pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 leading-tight text-center">
                        Not a law firm. Information only. <br />
                        <Link href="/terms" className="underline hover:text-gray-600">Terms</Link> • <Link href="/privacy" className="underline hover:text-gray-600">Privacy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
