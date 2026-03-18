"use client";

import Link from "next/link";
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
    HelpCircle,
    ShieldAlert,
    Route
} from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { BrandLogo } from "./BrandLogo";
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
            title: t("sidebar.caseWorkspace"),
            items: [
                { name: t("sidebar.dashboard"), href: "/", icon: LayoutDashboard },
                { name: t("sidebar.myCases"), href: "/tracker/cases", icon: FolderOpen },
                { name: t("sidebar.documents"), href: "/vault", icon: FileText },
                { name: t("sidebar.tasks"), href: "/tracker/tasks", icon: Calendar },
                { name: t("sidebar.timeline"), href: "/tracker/history/travel", icon: History },
            ]
        },
        {
            title: t("sidebar.guidance"),
            items: [
                { name: "Crisis Corridor", href: "/crisis-home", icon: ShieldAlert },
                { name: "Crisis Console", href: "/crisis", icon: Route },
                { name: t("sidebar.knowledgeBase"), href: "/knowledge", icon: BookOpen },
                { name: t("sidebar.attorneys"), href: "/attorneys", icon: UserGroupIcon },
                { name: t("sidebar.embassy"), href: "/map", icon: Map },
                { name: t("sidebar.help"), href: "/help", icon: HelpCircle },
            ]
        }
    ];

    return (
        <div className="w-64 border-r border-slate-800/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 text-slate-100 flex-shrink-0 flex flex-col h-screen fixed left-0 top-0 z-50">

            {/* Brand */}
            <div className="p-6 border-b border-slate-800">
                <BrandLogo variant="light" iconSize={40} className="w-full" />
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">What this app does</p>
                    <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                        Navigate emergencies, reunite families, and track immigration case history in one workspace.
                    </p>
                </div>
                <div className="mt-3">
                    <span className="live-chip border-emerald-400/20 bg-emerald-500/10 text-emerald-200">
                        <span className="live-dot bg-emerald-400" />
                        Realtime workspace active
                    </span>
                </div>
                {/* Language Switcher - Moved below logo */}
                <div className="mt-4">
                    <LanguageSwitcher />
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                {navGroups.map((group) => (
                    <div key={group.title}>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive =
                                    item.href === "/"
                                        ? pathname === "/"
                                        : pathname === item.href || pathname?.startsWith(`${item.href}/`);
                                return (
                                    <Link key={item.href} href={item.href}>
                                        <motion.div
                                            whileHover={{ x: 2, scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? "shimmer-border bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-fuchsia-500/10 text-white border border-indigo-300/40 shadow-inner"
                                                : "text-slate-300 border border-transparent hover:bg-slate-800/80 hover:text-white hover:border-slate-700/70"
                                                }`}
                                        >
                                            <item.icon size={18} className={isActive ? "text-blue-300" : ""} />
                                            {item.name}
                                        </motion.div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Footer */}
            <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-950/50">
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-slate-200 font-bold">
                        {user?.email?.[0].toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.email?.split('@')[0] || "Guest User"}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{t("sidebar.googleAccount")}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-slate-300 hover:text-red-300 hover:bg-slate-800 px-3 py-2 w-full rounded-lg text-sm transition-colors"
                >
                    <LogOut size={16} />
                    {t("sidebar.logOut")}
                </button>

                <div className="px-3 pt-2 border-t border-slate-800">
                    <p className="text-[10px] text-slate-400 leading-tight text-center">
                        {t("sidebar.disclaimer")} <br />
                        <Link href="/terms" className="underline hover:text-slate-200">{t("sidebar.terms")}</Link> • <Link href="/privacy" className="underline hover:text-slate-200">{t("sidebar.privacy")}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
