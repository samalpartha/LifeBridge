"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { ArrowLeft, GitCommit, Calendar, ExternalLink, AlertTriangle } from "lucide-react";
import { knowledgeApi, KnowledgeContent } from "../../../features/knowledge/api/client";

export default function KnowledgeDetailPage() {
    const params = useParams();
    const [content, setContent] = useState<KnowledgeContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (params.slug) {
            knowledgeApi.getTopicContent(params.slug as string)
                .then(setContent)
                .catch(() => setError(true))
                .finally(() => setLoading(false));
        }
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center justify-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Topic not found</h2>
                <Link href="/knowledge" className="text-blue-600 hover:underline">
                    Back to Knowledge Base
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/knowledge" className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">{content.title}</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-yellow-800 text-sm">
                        <AlertTriangle className="flex-shrink-0" size={20} />
                        <p>
                            <strong>Not Legal Advice:</strong> This content is for educational purposes only. Always consult with a qualified immigration attorney for your specific case.
                        </p>
                    </div>

                    <div className="prose prose-blue max-w-none bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                        <ReactMarkdown
                            rehypePlugins={[rehypeRaw]}
                            components={{
                                a: ({ node, ...props }) => <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />,
                                h1: ({ node, ...props }) => <h1 {...props} className="text-3xl font-bold mb-6 pb-2 border-b border-gray-100" />,
                                h2: ({ node, ...props }) => <h2 {...props} className="text-2xl font-bold mt-8 mb-4" />,
                                h3: ({ node, ...props }) => <h3 {...props} className="text-xl font-bold mt-6 mb-3" />,
                                ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-6 space-y-1 mb-4" />,
                                ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-6 space-y-1 mb-4" />,
                            }}
                        >
                            {content.content}
                        </ReactMarkdown>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
                        <h3 className="font-semibold text-gray-900 mb-4">About this content</h3>
                        <div className="space-y-4 text-sm text-gray-600">
                            {content.last_updated && (
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-gray-400" />
                                    <span>Updated: {new Date(content.last_updated).toLocaleDateString()}</span>
                                </div>
                            )}
                            {content.commit_sha && (
                                <div className="flex items-center gap-2">
                                    <GitCommit size={16} className="text-gray-400" />
                                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                        {content.commit_sha.substring(0, 7)}
                                    </span>
                                </div>
                            )}
                        </div>

                        <hr className="my-4 border-gray-100" />

                        <p className="text-xs text-gray-500">
                            Sourced from the <a href="https://github.com/t3nsor/us-immigration-faq" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">US Immigration FAQ</a> repository.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
