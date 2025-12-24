
export async function translateText(text: string, target: string, source: string = "en"): Promise<string> {
    try {
        const res = await fetch("/api/translate", {
            method: "POST",
            body: JSON.stringify({
                text,
                source,
                target,
            }),
            headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) {
            throw new Error(`Translation failed: ${res.statusText}`);
        }

        const data = await res.json();
        return data.translatedText || text;
    } catch (error) {
        console.error("Translation error:", error);
        return text; // Fallback to original text on error
    }
}
