"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, ArrowRight } from "lucide-react";
import { knowledgeApi, KnowledgeTopic } from "../../features/knowledge/api/client";

export default function KnowledgeIndexPage() {
    const [topics, setTopics] = useState<KnowledgeTopic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        knowledgeApi.getTopics()
            .then(setTopics)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <BookOpen className="text-blue-600" />
                        Immigration Knowledge Base
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Curated guides and FAQs from the community. Not legal advice.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-sm text-blue-800">
                    <strong>Disclaimer:</strong> This content is sourced from the open-source community and is for educational purposes only. It does not constitute legal advice.
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Featured: Law Search */}
                        <Link href="/knowledge/laws">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-8 text-white shadow-lg hover:shadow-xl transition group cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                                            Search US Immigration Laws
                                            <ArrowRight size={24} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition" />
                                        </h2>
                                        <p className="text-blue-100 max-w-2xl">
                                            Access a searchable database of official immigration questions, answers, and legal contexts powered by legal datasets.
                                        </p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                                        <BookOpen size={48} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {topics.map((topic) => (
                                <Link key={topic.id} href={`/knowledge/${topic.id}`} className="group">
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full hover:shadow-md transition flex flex-col">
                                        <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition mb-2">
                                            {topic.title}
                                        </h3>
                                        <p className="text-gray-500 flex-grow mb-4">
                                            {topic.description}
                                        </p>
                                        <div className="flex items-center text-blue-600 font-medium text-sm mt-auto">
                                            Read Guide <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
