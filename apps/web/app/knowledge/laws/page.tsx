"use client";

import { useState } from "react";
import { Search, BookOpen, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

type SearchHit = {
    Question: string;
    Answer: string;
    Context: string;
    _score?: number;
};

export default function ImmigrationLawsPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchHit[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError("");
        setSearched(true);
        setResults([]);

        try {
            const res = await fetch(`/api/immigration-laws/search?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error("Search failed");
            const data = await res.json();
            setResults(data.hits || []);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch results. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/knowledge">
                        <button className="p-2 hover:bg-gray-200 rounded-full transition">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <BookOpen className="text-blue-600" />
                            Immigration Law Q&A
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Search official U.S. immigration laws and statutes.
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="e.g. visa overstay penalty, asylum eligibility"
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {loading ? "Searching..." : "Search"}
                        </button>
                    </form>
                </div>

                {/* Results */}
                <div className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-2">Searching legal database...</p>
                        </div>
                    )}

                    {!loading && searched && results.length === 0 && !error && (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            No results found for "{query}". Try a different keyword.
                        </div>
                    )}

                    <div className="grid gap-6">
                        {results.map((hit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{hit.Question}</h3>
                                <p className="text-gray-700 mb-4 leading-relaxed">{hit.Answer}</p>

                                <details className="group">
                                    <summary className="flex items-center gap-2 text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700 select-none">
                                        <span>Show Legal Context</span>
                                        <div className="h-px bg-blue-100 flex-1 group-open:bg-transparent"></div>
                                    </summary>
                                    <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 font-mono leading-relaxed border border-gray-100 italic">
                                        "{hit.Context}"
                                    </div>
                                </details>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Footer Disclaimer */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-blue-800">
                        <strong>Disclaimer:</strong> This tool uses an AI-curated dataset of U.S. immigration laws.
                        It is for informational purposes only and does not constitute legal advice.
                        Always consult with a qualified attorney for your specific case.
                    </p>
                </div>
            </div>
        </div>
    );
}
