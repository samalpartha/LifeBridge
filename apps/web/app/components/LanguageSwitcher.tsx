"use client";

import { useLanguage } from "../contexts/LanguageContext";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    return (
        <div className="flex bg-gray-100 rounded-lg p-1">
            <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === "en" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage("es")}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${language === "es" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                ES
            </button>
        </div>
    );
}
