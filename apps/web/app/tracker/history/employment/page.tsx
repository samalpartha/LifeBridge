"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Briefcase } from "lucide-react";
import { trackerApi, EmploymentEntry } from "@/features/tracker/api/client";

export default function EmploymentPage() {
    const [entries, setEntries] = useState<EmploymentEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [employer, setEmployer] = useState("");
    const [title, setTitle] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await trackerApi.getEmploymentHistory();
            setEntries(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const newEntry = await trackerApi.addEmploymentEntry({
                employer,
                title,
                start_date: startDate,
                end_date: endDate || undefined,
                city,
                state
            });
            setEntries([...entries, newEntry]);
            setEmployer(""); setTitle(""); setStartDate(""); setEndDate(""); setCity(""); setState("");
        } catch (e) {
            alert("Failed to save entry");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Add Employment</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Employer</label>
                        <input value={employer} onChange={e => setEmployer(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Company Name" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Job Title</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Software Engineer" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                        <input value={city} onChange={e => setCity(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="San Francisco" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                        <input value={state} onChange={e => setState(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="CA" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">End Date (Optional)</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="md:col-span-2 flex justify-end mt-2">
                        <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                            <Save size={16} /> Save
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Employment History</h2>
                {entries.map((entry, i) => (
                    <motion.div key={entry.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">{entry.employer} - {entry.title}</h3>
                                <p className="text-xs text-gray-500">{entry.city}, {entry.state}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-700">{entry.start_date}</p>
                            {entry.end_date && <p className="text-xs text-gray-400">to {entry.end_date}</p>}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
