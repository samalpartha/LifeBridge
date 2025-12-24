import { NextResponse } from "next/server";

const HF_DATASET = "harshitha008/US-immigration-laws";
const HF_CONFIG = "default";
const HF_SPLIT = "train";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q) {
        return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
    }

    // Dataset Viewer API base
    const url = new URL("https://datasets-server.huggingface.co/search");
    url.searchParams.set("dataset", HF_DATASET);
    url.searchParams.set("config", HF_CONFIG);
    url.searchParams.set("split", HF_SPLIT);
    url.searchParams.set("query", q);

    try {
        const res = await fetch(url.toString(), {
            headers: process.env.HF_TOKEN
                ? { Authorization: `Bearer ${process.env.HF_TOKEN}` }
                : undefined,
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            // Log sensitive details only on server
            console.error(`HF API Error: ${res.status} ${res.statusText}`);
            return NextResponse.json(
                { error: "Failed to fetch from Hugging Face", status: res.status },
                { status: 502 }
            );
        }

        const data = await res.json();

        // Normalize hits
        const hits = (data?.rows || []).map((r: any) => ({
            ...((r?.row ?? r?.content ?? {}) as Record<string, any>),
            _score: r?.score,
        }));

        return NextResponse.json({ q, hits });
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
