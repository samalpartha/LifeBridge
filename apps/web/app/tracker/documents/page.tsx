"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Download } from "lucide-react";
import { trackerApi, DocumentEntry } from "@/features/tracker/api/client";
import toast from "react-hot-toast";

export default function DocumentsPage() {
    const [docs, setDocs] = useState<DocumentEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Upload Form State
    const [file, setFile] = useState<File | null>(null);
    const [category, setCategory] = useState("General");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await trackerApi.getDocuments();
            setDocs(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        try {
            setSubmitting(true);
            // Simulate upload by just sending metadata
            const newDoc = await trackerApi.addDocument({
                filename: file.name,
                category: category,
                // In real app, we'd upload to S3 and get a key back
            });
            setDocs([...docs, newDoc]);
            setFile(null);
            setCategory("General");
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            toast.success("Document uploaded successfully");
        } catch (e) {
            toast.error("Failed to upload document");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
                        <p className="text-gray-500">Securely store your immigration documents.</p>
                    </div>
                </div>

                {/* Upload Area */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Upload Document</h2>
                    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Select File</label>
                            <input
                                id="file-upload"
                                type="file"
                                onChange={handleFileChange}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <div className="w-48">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                <option>General</option>
                                <option>Passport</option>
                                <option>Visa</option>
                                <option>Employment</option>
                                <option>Legal</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={!file || submitting}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            <Upload size={16} />
                            {submitting ? "Uploading..." : "Upload"}
                        </button>
                    </form>
                </div>

                {/* Document List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {loading ? (
                        <p className="text-gray-400 text-sm">Loading documents...</p>
                    ) : docs.length === 0 ? (
                        <div className="col-span-2 p-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
                            <FileText className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm">No documents uploaded yet.</p>
                        </div>
                    ) : (
                        docs.map((doc, i) => (
                            <motion.div
                                key={doc.id || i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 flex-shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-medium text-gray-900 truncate">{doc.filename}</h3>
                                        <p className="text-xs text-gray-500">{doc.category} • {doc.upload_date}</p>
                                    </div>
                                </div>
                                <button className="p-2 text-gray-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100">
                                    <Download size={18} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
