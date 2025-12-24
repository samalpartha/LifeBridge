"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Globe, ExternalLink, Plane, Tag } from "lucide-react";
import { trackerApi, TravelEntry } from "@/features/tracker/api/client";

export default function HistoryPage() {
    const [entries, setEntries] = useState<TravelEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [country, setCountry] = useState("");
    const [entryDate, setEntryDate] = useState("");
    const [exitDate, setExitDate] = useState("");
    const [purpose, setPurpose] = useState("");
    const [port, setPort] = useState("");
    const [admissionClass, setAdmissionClass] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await trackerApi.getTravelHistory();
            setEntries(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!country || !entryDate || !purpose) return;

        try {
            setSubmitting(true);
            const newEntry = await trackerApi.addTravelEntry({
                country,
                entry_date: entryDate,
                exit_date: exitDate || undefined,
                purpose,
                port_of_entry: port,
                class_of_admission: admissionClass
            });
            setEntries([...entries, newEntry]); // Optimistic update
            // Reset form
            setCountry("");
            setEntryDate("");
            setExitDate("");
            setPurpose("");
            setPort("");
            setAdmissionClass("");
        } catch (e) {
            alert("Failed to save entry");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* I-94 Retrieval CTA */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-blue-900 font-bold text-lg mb-1">Official I-94 Record</h3>
                    <p className="text-blue-700 text-sm">Need your official travel history? Retrieve it directly from the CBP website.</p>
                </div>
                <a
                    href="https://i94.cbp.dhs.gov/I94/#/history-search"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                    Retrieve I-94
                    <ExternalLink size={16} />
                </a>
            </div>

            {/* Input Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 mb-6 uppercase tracking-wider border-b pb-2">Add New Trip</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                        <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="e.g. France"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Purpose / Visa Type</label>
                        <input
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="e.g. Tourist (B2), H1B"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Port of Entry</label>
                        <input
                            type="text"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            placeholder="e.g. SFO, JFK"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Class of Admission</label>
                        <input
                            type="text"
                            value={admissionClass}
                            onChange={(e) => setAdmissionClass(e.target.value)}
                            placeholder="e.g. B2, H1B"
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Entry Date</label>
                        <input
                            type="date"
                            value={entryDate}
                            onChange={(e) => setEntryDate(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Exit Date (Optional)</label>
                        <input
                            type="date"
                            value={exitDate}
                            onChange={(e) => setExitDate(e.target.value)}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            <Save size={16} />
                            {submitting ? "Saving..." : "Save Entry"}
                        </button>
                    </div>
                </form>
            </div>

            {/* List */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Past Trips</h2>
                {loading ? (
                    <p className="text-gray-400 text-sm">Loading history...</p>
                ) : entries.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-gray-300">
                        <Globe className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">No travel history recorded yet.</p>
                    </div>
                ) : (
                    entries.map((entry, i) => (
                        <motion.div
                            key={entry.id || i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{entry.country}</h3>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                                            <Tag size={10} /> {entry.purpose}
                                        </span>
                                        {entry.port_of_entry && (
                                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Plane size={10} /> {entry.port_of_entry}
                                            </span>
                                        )}
                                        {entry.class_of_admission && (
                                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                                                {entry.class_of_admission}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">{entry.entry_date}</p>
                                {entry.exit_date && <p className="text-xs text-gray-400">to {entry.exit_date}</p>}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
