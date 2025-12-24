
import { NextResponse } from 'next/server';

const MOCK_DICTIONARY: Record<string, string> = {
    // UI Elements
    "Checklist": "Lista de Verificación",
    "Risks": "Riesgos",
    "Timeline": "Cronograma",
    "Summary": "Resumen",
    "High": "Alto",
    "Medium": "Medio",
    "Low": "Bajo",
    "Done": "Hecho",
    "In Progress": "En Progreso",
    "Todo": "Por Hacer",
    "Family Reunion (Demo)": "Reunión Familiar (Demo)",

    // Demo Content Specifics (Fallback)
    "Invitation Letter for Family Visit.": "Carta de Invitación para Visita Familiar.",
    "Host: Alex Rivera. Address: 10 Maple St, Toronto, ON.": "Anfitrión: Alex Rivera. Dirección: 10 Maple St, Toronto, ON.",
    "Visitor: Sam Rivera. Travel window: January 15 - February 28, 2025.": "Visitante: Sam Rivera. Ventana de viaje: 15 de enero - 28 de febrero de 2025.",
    "Passport Number: P12345678, valid until December 2026.": "Número de Pasaporte: P12345678, válido hasta diciembre de 2026.",
    "Purpose: family visit during school holiday to spend time together.": "Propósito: visita familiar durante las vacaciones escolares para pasar tiempo juntos.",
    "Relationship: Parent and child.": "Relación: Padre e hijo.",
    "Accommodation: Guest room in host's residence.": "Alojamiento: Habitación de huéspedes en la residencia del anfitrión.",
    "Financial support: Host will cover all expenses during visit.": "Apoyo financiero: El anfitrión cubrirá todos los gastos durante la visita."
};

export async function POST(request: Request) {
    try {
        const { text, target, source = "en" } = await request.json();

        if (!text || !target) {
            return NextResponse.json({ error: "Missing text or target" }, { status: 400 });
        }

        // 1. Try MyMemory API (Free, no key required)
        try {
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                if (data.responseData && data.responseData.translatedText) {
                    return NextResponse.json({ translatedText: data.responseData.translatedText });
                }
            }
        } catch (e) {
            console.warn("MyMemory API failed, falling back to mocks", e);
        }

        // 2. Fallback Mock Translation
        let translated = text;
        if (target === 'es') {
            if (MOCK_DICTIONARY[text]) {
                translated = MOCK_DICTIONARY[text];
            } else {
                // Heuristic: if it's likely just a UI label not in dict, or dynamic content
                translated = `[ES] ${text}`;
            }
        }

        return NextResponse.json({ translatedText: translated });

    } catch (error) {
        console.error("Translation proxy error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
