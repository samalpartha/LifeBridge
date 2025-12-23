"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "es";

const dictionary = {
    en: {
        heroTitle: "Transform Documents into Action Plans",
        heroSubtitle: "Upload your cross-border mobility documents. Get AI-powered checklists, timelines, and risk assessments—all with evidence-backed insights.",
        tryDemo: "⚡ Try Demo Now",
        processing: "Processing...",
        createNewCase: "Create New Case",
        findEmbassy: "🌍 Find Embassy",
        whyChoose: "Why Choose LifeBridge?",
        openSource: "Open Source",
        processingSpeed: "Processing Speed",
        evidenceLinks: "Evidence Links",
        features: {
            smartDoc: "Smart Document Processing",
            aiAnalysis: "AI-Powered Analysis",
            evidence: "Evidence Linking",
            fast: "Lightning Fast"
        }
    },
    es: {
        heroTitle: "Transforma Documentos en Planes de Acción",
        heroSubtitle: "Sube tus documentos de movilidad transfronteriza. Obtén listas de verificación, cronogramas y evaluaciones de riesgo impulsadas por IA, todo con evidencia.",
        tryDemo: "⚡ Prueba la Demo",
        processing: "Procesando...",
        createNewCase: "Crear Nuevo Caso",
        findEmbassy: "🌍 Buscar Embajada",
        whyChoose: "¿Por qué elegir LifeBridge?",
        openSource: "Código Abierto",
        processingSpeed: "Velocidad de Proceso",
        evidenceLinks: "Enlaces de Evidencia",
        features: {
            smartDoc: "Procesamiento Inteligente",
            aiAnalysis: "Análisis por IA",
            evidence: "Enlaces de Evidencia",
            fast: "Ultra Rápido"
        }
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>("en");

    const t = (path: string) => {
        const keys = path.split(".");
        let current: any = dictionary[language];
        for (const k of keys) {
            if (current[k] === undefined) return path;
            current = current[k];
        }
        return current;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
