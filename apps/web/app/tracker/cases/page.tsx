"use client";

import { useState, useEffect } from "react";
import { Plus, Folder, Calendar, Clock, ChevronRight } from "lucide-react";
import { trackerApi, CaseEntry } from "@/features/tracker/api/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CasesPage() {
    const router = useRouter();
    const [cases, setCases] = useState<CaseEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newItem, setNewItem] = useState<CaseEntry>({
        title: "",
        case_type: "I-130",
        status: "Open",
        filing_date: "",
        priority_date: "",
        receipt_number: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const data = await trackerApi.getCases();
            setCases(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!newItem.title) return;
        try {
            await trackerApi.addCase(newItem);
            setIsModalOpen(false);
            setNewItem({ title: "", case_type: "I-130", status: "Open", filing_date: "", priority_date: "", receipt_number: "" });
            loadData();
        } catch (e) {
            console.error(e);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'open': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Cases</h1>
                        <p className="text-gray-500 mt-1">Manage your immigration petitions and applications.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        <Plus size={18} />
                        New Case
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading cases...</div>
                ) : cases.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <Folder className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No cases found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new case.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {cases.map((c) => (
                            <Link key={c.id} href={`/tracker/cases/${c.id}`}>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition cursor-pointer flex justify-between items-center group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <Folder size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition">{c.title}</h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <span className="font-medium text-gray-700">{c.case_type}</span>
                                                {c.filing_date && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={14} /> Filed: {c.filing_date}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getStatusColor(c.status)}`}>
                                            {c.status}
                                        </span>
                                        <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                            <h2 className="text-xl font-bold mb-4">Create New Case</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
                                    <input
                                        className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newItem.title}
                                        onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                        placeholder="e.g. Spouse Visa Application"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <input
                                            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newItem.case_type}
                                            onChange={e => setNewItem({ ...newItem, case_type: e.target.value })}
                                            placeholder="e.g. I-130"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                                        <input
                                            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                            value={newItem.receipt_number || ""}
                                            onChange={e => setNewItem({ ...newItem, receipt_number: e.target.value })}
                                            placeholder="e.g. IOE..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                        <select
                                            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={newItem.status}
                                            onChange={e => setNewItem({ ...newItem, status: e.target.value })}
                                        >
                                            <option value="Open">Open</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Filing Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={newItem.filing_date}
                                        onChange={e => setNewItem({ ...newItem, filing_date: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Create Case
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
