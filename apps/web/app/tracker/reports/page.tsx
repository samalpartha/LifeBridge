"use client";

import { useState } from "react";
import { FileText, Download, AlertCircle, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function ReportsPage() {
    const [templateId, setTemplateId] = useState("case_timeline");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Default sample data for the timeline template
    const [jsonData, setJsonData] = useState(JSON.stringify({
        generated_date: new Date().toISOString().split('T')[0],
        case_id: "LB-2024-001",
        client_name: "John Doe",
        events: [
            { date: "2023-01-15", title: "Initial Consultation", description: "Met with attorney to discuss visa options." },
            { date: "2023-02-01", title: "Documents Gathered", description: "Collected passport, birth certificate, and financial records." },
            { date: "2023-03-10", title: "Application Submitted", description: "Form I-130 filed with USCIS." },
            { date: "2023-06-22", title: "Receipt Notice", description: "Received I-797C Notice of Action." }
        ]
    }, null, 4));

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError("");

            let parsedData;
            try {
                parsedData = JSON.parse(jsonData);
            } catch (e) {
                setError("Invalid JSON format.");
                setLoading(false);
                return;
            }

            const response = await fetch("/api/docgen/render", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    template_id: templateId,
                    data: parsedData
                })
            });

            if (!response.ok) {
                throw new Error(`Generation failed: ${response.statusText}`);
            }

            // Trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${templateId}_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err: any) {
            const message = err?.message || "An error occurred during generation.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="glass-panel shimmer-border animate-enter border-indigo-100 bg-gradient-to-br from-white via-indigo-50/40 to-sky-50/20 p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    Reports Workspace Live
                </div>
                <h1 className="mt-3 text-3xl font-bold text-gray-900">Document Generation</h1>
                <p className="mt-2 max-w-3xl text-gray-600">
                    Generate polished, downloadable case reports directly from your tracked timeline data.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Controls */}
                <div className="space-y-5 lg:col-span-1">
                    <div className="surface-card p-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                        <select
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 bg-white p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="case_timeline">Case Timeline Summary</option>
                        </select>

                        <div className="mt-6">
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? (
                                    "Generating..."
                                ) : (
                                    <>
                                        <FileText size={18} />
                                        Generate PDF
                                    </>
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                <AlertCircle size={16} className="mt-0.5" />
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="surface-card border-blue-100 bg-blue-50/80 p-4 text-xs text-blue-700">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-blue-800">
                            <Download size={16} />
                            About DocGen
                        </h3>
                        This service uses WeasyPrint to render high-fidelity PDF case reports from structured JSON.
                        <br />
                        <br />
                        <strong>Supported:</strong> CSS paged media, robust print styles, and production-ready output.
                    </div>
                </div>

                {/* Data Editor */}
                <div className="lg:col-span-2">
                    <div className="surface-card h-full p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">Template Data (JSON)</label>
                            <button
                                onClick={() => setJsonData(JSON.stringify(JSON.parse(jsonData), null, 4))}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Format JSON
                            </button>
                        </div>
                        <textarea
                            value={jsonData}
                            onChange={(e) => setJsonData(e.target.value)}
                            className="min-h-[440px] w-full rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
