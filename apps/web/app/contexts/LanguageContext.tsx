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
            myCases: "My Cases",
            documents: "Documents",
            tasks: "Tasks",
            timeline: "Timeline",
            knowledgeBase: "Knowledge Base",
            tracker: "Immigration Tracker",
            vault: "Evidence Vault",
            reports: "Reports & Documents",
            attorneys: "Attorney Network",
            resources: "Resources",
            embassy: "Find Embassy",
            help: "Help",
            logOut: "Log Out",
            caseWorkspace: "Case Workspace",
            guidance: "Guidance",
            googleAccount: "Google Account",
            disclaimer: "Not a law firm. Information only.",
            terms: "Terms",
            privacy: "Privacy"
        },
        dashboard: {
            welcome: "Welcome to your Action Center",
            subtitle: "Track your progress, manage evidence, and move your immigration journey forward.",
            startNewCase: "Start a New Immigration Case",
            tryDemo: "or try a demo case to explore features",
            activeCases: "Active Cases",
            viewAll: "View All",
            createNewCase: "Create New Case",
            selectScenario: "Select a scenario to get a tailored checklist.",
            caseTitle: "Case Title",
            nameOrFirm: "Name or Firm (Optional)",
            location: "Location",
            createAndStart: "Create Case & Start Checklist",
            scenarios: {
                familyReunion: "Family Reunion",
                familyDesc: "Visa support for family visits",
                workVisa: "Work Visa",
                workDesc: "Employment documentation",
                travelSupport: "Travel Support",
                travelDesc: "First-time traveler assistance"
            },
            legalDisclaimer: "Legal Disclaimer:",
            disclaimerText: "LifeBridge is an AI-powered document assistant, not a law firm. Determinations and checklists provided herein are for informational purposes only and do not constitute legal advice. Always consult with a qualified immigration attorney for your specific case.",
            dataCompliance: "Data stored locally on US servers. SOC2 Compliant (Pending)."
        },
        attorneys: {
            title: "Find an Attorney",
            subtitle: "Use AI to find verified immigration experts near you.",
            location: "Location",
            zipPlaceholder: "Enter ZIP Code (e.g. 10001)",
            nameOrFirm: "Name or Firm (Optional)",
            searchPlaceholder: "e.g. 'Smith Law' or 'John Doe'",
            searchButton: "Search Attorneys",
            searching: "Searching...",
            noResults: "Enter a ZIP code or Name to start searching",
            verified: "Verified Professional Directory",
            contactInfo: "Contact Information",
            contactNow: "Contact Now",
            reviews: "reviews",
            match: "Match",
            mapView: "Map view will update when you search",
            loadingMap: "Loading Map...",
            disclaimer: "Information sourced from public records and AI generation. Always verify credentials independently."
        },
        embassy: {
            title: "Find Embassy",
            subtitle: "Locate embassies and consulates worldwide",
            searchCountry: "Search by country",
            findNearest: "Find Nearest",
            address: "Address",
            phone: "Phone",
            hours: "Hours",
            services: "Services",
            appointment: "Schedule Appointment"
        },
        vault: {
            title: "Document Vault",
            subtitle: "Securely store and manage your immigration documents",
            upload: "Upload Document",
            category: "Category",
            fileName: "File Name",
            uploadDate: "Upload Date",
            size: "Size",
            download: "Download",
            delete: "Delete",
            preview: "Preview",
            noDocuments: "No documents uploaded yet",
            uploadSuccess: "Document uploaded successfully",
            deleteConfirm: "Are you sure you want to delete this document?"
        },
        knowledge: {
            title: "Knowledge Base",
            subtitle: "Learn about immigration processes and requirements",
            search: "Search articles...",
            categories: "Categories",
            articles: "Articles",
            laws: "Immigration Laws",
            checklists: "Checklists",
            guides: "Guides",
            faq: "Frequently Asked Questions",
            readMore: "Read More",
            relatedArticles: "Related Articles"
        },
        help: {
            title: "Help Center",
            subtitle: "Get support and answers to your questions",
            searchHelp: "Search for help...",
            contactSupport: "Contact Support",
            documentation: "Documentation",
            tutorials: "Tutorials",
            community: "Community Forum"
        },
        auth: {
            login: {
                title: "Sign In",
                email: "Email Address",
                password: "Password",
                submit: "Sign In",
                forgotPassword: "Forgot Password?",
                noAccount: "Don't have an account?",
                signUp: "Sign Up",
                googleSignIn: "Sign in with Google"
            },
            signup: {
                title: "Create Account",
                name: "Full Name",
                email: "Email Address",
                password: "Password",
                confirmPassword: "Confirm Password",
                submit: "Create Account",
                haveAccount: "Already have an account?",
                signIn: "Sign In",
                terms: "By signing up, you agree to our",
                termsLink: "Terms of Service",
                and: "and",
                privacyLink: "Privacy Policy"
            },
            forgotPassword: {
                title: "Reset Password",
                subtitle: "Enter your email to receive reset instructions",
                email: "Email Address",
                submit: "Send Reset Link",
                backToLogin: "Back to Login",
                checkEmail: "Check your email for reset instructions"
            }
        },
        tracker: {
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
            },
            cases: {
                title: "My Cases",
                newCase: "New Case",
                caseTitle: "Case Title",
                caseType: "Case Type",
                status: "Status",
                priority: "Priority",
                filingDate: "Filing Date",
                receiptNumber: "Receipt Number",
                noCases: "No cases yet. Create your first case to get started.",
                open: "Open",
                closed: "Closed",
                pending: "Pending"
            },
            tasks: {
                title: "Tasks",
                addTask: "Add Task",
                taskTitle: "Task Title",
                description: "Description",
                dueDate: "Due Date",
                assignee: "Assignee",
                status: "Status",
                priority: "Priority",
                noTasks: "No tasks yet",
                completed: "Completed",
                inProgress: "In Progress",
                pending: "Pending",
                high: "High",
                medium: "Medium",
                low: "Low"
            },
            documents: {
                title: "Documents",
                upload: "Upload",
                category: "Category",
                linkedCase: "Linked Case",
                noDocuments: "No documents uploaded"
            },
            reports: {
                title: "Reports & Documents",
                generate: "Generate Report",
                exportPDF: "Export as PDF",
                history: "Report History",
                noReports: "No reports generated yet"
            },
            history: {
                travel: "Travel History",
                employment: "Employment History",
                residence: "Residence History",
                addEntry: "Add Entry",
                country: "Country",
                entryDate: "Entry Date",
                exitDate: "Exit Date",
                purpose: "Purpose",
                employer: "Employer",
                position: "Position",
                startDate: "Start Date",
                endDate: "End Date",
                city: "City",
                state: "State",
                noEntries: "No entries yet"
            }
        },
        common: {
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            edit: "Edit",
            search: "Search",
            loading: "Loading...",
            error: "Error",
            success: "Success",
            required: "Required",
            optional: "Optional",
            back: "Back",
            next: "Next",
            submit: "Submit",
            close: "Close",
            confirm: "Confirm",
            yes: "Yes",
            no: "No",
            viewAll: "View All",
            showMore: "Show More",
            showLess: "Show Less",
            filter: "Filter",
            sort: "Sort",
            export: "Export",
            import: "Import",
            refresh: "Refresh",
            settings: "Settings",
            profile: "Profile",
            logout: "Log Out",
            home: "Home"
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
            myCases: "Mis Casos",
            documents: "Documentos",
            tasks: "Tareas",
            timeline: "Línea de Tiempo",
            knowledgeBase: "Base de Conocimientos",
            tracker: "Rastreador de Inmigración",
            vault: "Bóveda de Evidencia",
            reports: "Reportes y Documentos",
            attorneys: "Red de Abogados",
            resources: "Recursos",
            embassy: "Buscar Embajada",
            help: "Ayuda",
            logOut: "Cerrar Sesión",
            caseWorkspace: "Espacio de Trabajo",
            guidance: "Orientación",
            googleAccount: "Cuenta de Google",
            disclaimer: "No es un bufete de abogados. Solo información.",
            terms: "Términos",
            privacy: "Privacidad"
        },
        dashboard: {
            welcome: "Bienvenido a tu Centro de Acción",
            subtitle: "Rastrea tu progreso, gestiona evidencia y avanza en tu proceso migratorio.",
            startNewCase: "Iniciar un Nuevo Caso de Inmigración",
            tryDemo: "o prueba un caso de demostración para explorar funciones",
            activeCases: "Casos Activos",
            viewAll: "Ver Todos",
            createNewCase: "Crear Nuevo Caso",
            selectScenario: "Selecciona un escenario para obtener una lista personalizada.",
            caseTitle: "Título del Caso",
            nameOrFirm: "Nombre o Firma (Opcional)",
            location: "Ubicación",
            createAndStart: "Crear Caso e Iniciar Lista",
            scenarios: {
                familyReunion: "Reunificación Familiar",
                familyDesc: "Apoyo de visa para visitas familiares",
                workVisa: "Visa de Trabajo",
                workDesc: "Documentación de empleo",
                travelSupport: "Apoyo de Viaje",
                travelDesc: "Asistencia para viajeros primerizos"
            },
            legalDisclaimer: "Aviso Legal:",
            disclaimerText: "LifeBridge es un asistente de documentos impulsado por IA, no un bufete de abogados. Las determinaciones y listas de verificación proporcionadas aquí son solo para fines informativos y no constituyen asesoramiento legal. Siempre consulte con un abogado de inmigración calificado para su caso específico.",
            dataCompliance: "Datos almacenados localmente en servidores de EE. UU. Cumplimiento SOC2 (Pendiente)."
        },
        attorneys: {
            title: "Buscar un Abogado",
            subtitle: "Usa IA para encontrar expertos en inmigración verificados cerca de ti.",
            location: "Ubicación",
            zipPlaceholder: "Ingresa Código Postal (ej. 10001)",
            nameOrFirm: "Nombre o Firma (Opcional)",
            searchPlaceholder: "ej. 'Smith Law' o 'John Doe'",
            searchButton: "Buscar Abogados",
            searching: "Buscando...",
            noResults: "Ingresa un código postal o nombre para comenzar la búsqueda",
            verified: "Directorio Profesional Verificado",
            contactInfo: "Información de Contacto",
            contactNow: "Contactar Ahora",
            reviews: "reseñas",
            match: "Coincidencia",
            mapView: "La vista del mapa se actualizará cuando busques",
            loadingMap: "Cargando Mapa...",
            disclaimer: "Información obtenida de registros públicos y generación de IA. Siempre verifica las credenciales de forma independiente."
        },
        embassy: {
            title: "Buscar Embajada",
            subtitle: "Localiza embajadas y consulados en todo el mundo",
            searchCountry: "Buscar por país",
            findNearest: "Encontrar Más Cercana",
            address: "Dirección",
            phone: "Teléfono",
            hours: "Horario",
            services: "Servicios",
            appointment: "Programar Cita"
        },
        vault: {
            title: "Bóveda de Documentos",
            subtitle: "Almacena y gestiona de forma segura tus documentos de inmigración",
            upload: "Subir Documento",
            category: "Categoría",
            fileName: "Nombre del Archivo",
            uploadDate: "Fecha de Subida",
            size: "Tamaño",
            download: "Descargar",
            delete: "Eliminar",
            preview: "Vista Previa",
            noDocuments: "No hay documentos subidos aún",
            uploadSuccess: "Documento subido exitosamente",
            deleteConfirm: "¿Estás seguro de que quieres eliminar este documento?"
        },
        knowledge: {
            title: "Base de Conocimientos",
            subtitle: "Aprende sobre procesos y requisitos de inmigración",
            search: "Buscar artículos...",
            categories: "Categorías",
            articles: "Artículos",
            laws: "Leyes de Inmigración",
            checklists: "Listas de Verificación",
            guides: "Guías",
            faq: "Preguntas Frecuentes",
            readMore: "Leer Más",
            relatedArticles: "Artículos Relacionados"
        },
        help: {
            title: "Centro de Ayuda",
            subtitle: "Obtén soporte y respuestas a tus preguntas",
            searchHelp: "Buscar ayuda...",
            contactSupport: "Contactar Soporte",
            documentation: "Documentación",
            tutorials: "Tutoriales",
            community: "Foro de la Comunidad"
        },
        auth: {
            login: {
                title: "Iniciar Sesión",
                email: "Correo Electrónico",
                password: "Contraseña",
                submit: "Iniciar Sesión",
                forgotPassword: "¿Olvidaste tu Contraseña?",
                noAccount: "¿No tienes una cuenta?",
                signUp: "Registrarse",
                googleSignIn: "Iniciar sesión con Google"
            },
            signup: {
                title: "Crear Cuenta",
                name: "Nombre Completo",
                email: "Correo Electrónico",
                password: "Contraseña",
                confirmPassword: "Confirmar Contraseña",
                submit: "Crear Cuenta",
                haveAccount: "¿Ya tienes una cuenta?",
                signIn: "Iniciar Sesión",
                terms: "Al registrarte, aceptas nuestros",
                termsLink: "Términos de Servicio",
                and: "y",
                privacyLink: "Política de Privacidad"
            },
            forgotPassword: {
                title: "Restablecer Contraseña",
                subtitle: "Ingresa tu correo para recibir instrucciones de restablecimiento",
                email: "Correo Electrónico",
                submit: "Enviar Enlace de Restablecimiento",
                backToLogin: "Volver al Inicio de Sesión",
                checkEmail: "Revisa tu correo para las instrucciones de restablecimiento"
            }
        },
        tracker: {
            tabs: {
                travel: "Historial de Viajes",
                employment: "Historial de Empleo",
                residence: "Historial de Residencia"
            },
            cases: {
                title: "Mis Casos",
                newCase: "Nuevo Caso",
                caseTitle: "Título del Caso",
                caseType: "Tipo de Caso",
                status: "Estado",
                priority: "Prioridad",
                filingDate: "Fecha de Presentación",
                receiptNumber: "Número de Recibo",
                noCases: "No hay casos aún. Crea tu primer caso para comenzar.",
                open: "Abierto",
                closed: "Cerrado",
                pending: "Pendiente"
            },
            tasks: {
                title: "Tareas",
                addTask: "Añadir Tarea",
                taskTitle: "Título de la Tarea",
                description: "Descripción",
                dueDate: "Fecha de Vencimiento",
                assignee: "Asignado a",
                status: "Estado",
                priority: "Prioridad",
                noTasks: "No hay tareas aún",
                completed: "Completada",
                inProgress: "En Progreso",
                pending: "Pendiente",
                high: "Alta",
                medium: "Media",
                low: "Baja"
            },
            documents: {
                title: "Documentos",
                upload: "Subir",
                category: "Categoría",
                linkedCase: "Caso Vinculado",
                noDocuments: "No hay documentos subidos"
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
                save: "Guardar Contacto",
                noContacts: "No hay contactos aún"
            },
            notes: {
                title: "Notas del Caso",
                subtitle: "Realiza un seguimiento de pensamientos, reuniones y detalles importantes.",
                titleField: "Título",
                date: "Fecha",
                content: "Contenido",
                save: "Guardar Nota",
                noNotes: "No hay notas aún"
            },
            reports: {
                title: "Reportes y Documentos",
                generate: "Generar Reporte",
                exportPDF: "Exportar como PDF",
                history: "Historial de Reportes",
                noReports: "No hay reportes generados aún"
            },
            history: {
                travel: "Historial de Viajes",
                employment: "Historial de Empleo",
                residence: "Historial de Residencia",
                addEntry: "Añadir Entrada",
                country: "País",
                entryDate: "Fecha de Entrada",
                exitDate: "Fecha de Salida",
                purpose: "Propósito",
                employer: "Empleador",
                position: "Posición",
                startDate: "Fecha de Inicio",
                endDate: "Fecha de Fin",
                city: "Ciudad",
                state: "Estado",
                noEntries: "No hay entradas aún"
            }
        },
        common: {
            save: "Guardar",
            cancel: "Cancelar",
            delete: "Eliminar",
            edit: "Editar",
            search: "Buscar",
            loading: "Cargando...",
            error: "Error",
            success: "Éxito",
            required: "Requerido",
            optional: "Opcional",
            back: "Atrás",
            next: "Siguiente",
            submit: "Enviar",
            close: "Cerrar",
            confirm: "Confirmar",
            yes: "Sí",
            no: "No",
            viewAll: "Ver Todos",
            showMore: "Mostrar Más",
            showLess: "Mostrar Menos",
            filter: "Filtrar",
            sort: "Ordenar",
            export: "Exportar",
            import: "Importar",
            refresh: "Actualizar",
            settings: "Configuración",
            profile: "Perfil",
            logout: "Cerrar Sesión",
            home: "Inicio"
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
