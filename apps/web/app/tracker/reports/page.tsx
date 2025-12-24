"use client";

import { useState } from "react";
import { FileText, Download, Play, AlertCircle } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function ReportsPage() {
    const { t } = useLanguage();
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
            console.error(err);
            setError(err.message || "An error occurred during generation.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Document Generation</h1>
                    <p className="text-gray-500">Create official PDF reports and summaries from your case data.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
                            <select
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option value="case_timeline">Case Timeline Summary</option>
                                {/* Future templates */}
                            </select>

                            <div className="mt-6">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
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
                                <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5" />
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h3 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                                <Download size={16} />
                                About DocGen
                            </h3>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                This service uses a robust PDF rendering engine (WeasyPrint) to convert HTML templates into high-fidelity documents.
                                <br /><br />
                                <strong>Supported:</strong> CSS Paged Media, CMYK colors, PDF/A compliance readiness.
                            </p>
                        </div>
                    </div>

                    {/* Data Editor */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
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
                                className="flex-1 w-full p-4 font-mono text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 min-h-[400px]"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
