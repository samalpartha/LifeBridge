"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Globe } from "lucide-react";
import { trackerApi, TravelEntry } from "@/features/tracker/api/client";

export default function HistoryPage() {
    const [entries, setEntries] = useState<TravelEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [country, setCountry] = useState("");
    const [entryDate, setEntryDate] = useState("");
    const [exitDate, setExitDate] = useState("");
    const [purpose, setPurpose] = useState("");
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
                purpose
            });
            setEntries([...entries, newEntry]); // Optimistic update
            // Reset form
            setCountry("");
            setEntryDate("");
            setExitDate("");
            setPurpose("");
        } catch (e) {
            alert("Failed to save entry");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Input Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Add New Trip</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <label className="block text-xs font-medium text-gray-500 mb-1">Purpose</label>
                        <input
                            type="text"
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            placeholder="e.g. Vacation, Business"
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
                                    <p className="text-xs text-gray-500">{entry.purpose}</p>
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
