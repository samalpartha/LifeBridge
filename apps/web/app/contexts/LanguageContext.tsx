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
        },
        case: {
            checklist: "Checklist",
            risks: "Risks",
            timeline: "Timeline",
            summary: "Summary",
            tellStory: "Tell Your Story",
            saveStory: "Save Story",
            uploadDoc: "Upload Document",
            reanalyze: "Re-analyze Case"
        },
        sidebar: {
            dashboard: "Dashboard",
            tracker: "Immigration Tracker",
            vault: "Evidence Vault",
            reports: "Reports & Documents",
            attorneys: "Attorney Network",
            resources: "Resources",
            embassy: "Find Embassy"
        },
        tracker: {
            tabs: {
                travel: "Travel History",
                employment: "Employment History",
                residence: "Residence History"
            },
            contacts: {
                title: "Contacts Directory",
                subtitle: "Manage important contacts for your case.",
                add: "Add Contact",
                name: "Name",
                role: "Role",
                email: "Email",
                phone: "Phone",
                address: "Address",
                save: "Save Contact"
            },
            notes: {
                title: "Case Notes",
                subtitle: "Keep track of thoughts, meetings, and important details.",
                titleField: "Title",
                date: "Date",
                content: "Content",
                save: "Save Note"
            }
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
        },
        case: {
            checklist: "Lista de Verificación",
            risks: "Riesgos",
            timeline: "Cronograma",
            summary: "Resumen",
            tellStory: "Cuéntanos tu Historia",
            saveStory: "Guardar Historia",
            uploadDoc: "Subir Documento",
            reanalyze: "Reanalizar Caso"
        },
        sidebar: {
            dashboard: "Panel Principal",
            tracker: "Rastreador de Inmigración",
            vault: "Bóveda de Evidencia",
            reports: "Reportes y Documentos",
            attorneys: "Red de Abogados",
            resources: "Recursos",
            embassy: "Buscar Embajada"
        },
        tracker: {
            tabs: {
                travel: "Historial de Viajes",
                employment: "Historial de Empleo",
                residence: "Historial de Residencia"
            },
            contacts: {
                title: "Directorio de Contactos",
                subtitle: "Gestiona contactos importantes para tu caso.",
                add: "Añadir Contacto",
                name: "Nombre",
                role: "Rol",
                email: "Correo Electrónico",
                phone: "Teléfono",
                address: "Dirección",
                save: "Guardar Contacto"
            },
            notes: {
                title: "Notas del Caso",
                subtitle: "Realiza un seguimiento de pensamientos, reuniones y detalles importantes.",
                titleField: "Título",
                date: "Fecha",
                content: "Contenido",
                save: "Guardar Nota"
            }
        }
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
    translatedOutputs: any;
    translateDynamic: (text: string) => Promise<string>;
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

    const translateDynamic = async (text: string): Promise<string> => {
        if (language === "en") return text;
        // avoid circular dependency if possible, but importing lib here is fine
        const { translateText } = await import("../../lib/translate");
        return translateText(text, language);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, translatedOutputs: null, translateDynamic }}>
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
