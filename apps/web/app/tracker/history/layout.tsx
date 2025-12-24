"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Briefcase, Home, Globe } from "lucide-react";

import { useLanguage } from "../../contexts/LanguageContext";

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { t } = useLanguage();

    const tabs = [
        { name: t("tracker.tabs.travel"), href: "/tracker/history/travel", icon: Globe },
        { name: t("tracker.tabs.employment"), href: "/tracker/history/employment", icon: Briefcase },
        { name: t("tracker.tabs.residence"), href: "/tracker/history/residence", icon: Home },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/tracker">
                        <button className="p-2 hover:bg-gray-200 rounded-full transition">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">History Log</h1>
                        <p className="text-gray-500">Record your comprehensive immigration history.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-fit">
                    {tabs.map((tab) => {
                        const isActive = pathname.startsWith(tab.href);
                        return (
                            <Link key={tab.href} href={tab.href}>
                                <button
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${isActive
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.name}
                                </button>
                            </Link>
                        );
                    })}
                </div>

                {/* Content */}
                {children}

            </div>
        </div>
    );
}
