"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Home } from "lucide-react";
import { trackerApi, ResidenceEntry } from "@/features/tracker/api/client";

export default function ResidencePage() {
    const [entries, setEntries] = useState<ResidenceEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await trackerApi.getResidenceHistory();
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
            const newEntry = await trackerApi.addResidenceEntry({
                address,
                city,
                country,
                start_date: startDate,
                end_date: endDate || undefined
            });
            setEntries([...entries, newEntry]);
            setAddress(""); setCity(""); setCountry(""); setStartDate(""); setEndDate("");
        } catch (e) {
            alert("Failed to save entry");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Add Residence</h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                        <input value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="123 Main St" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                        <input value={city} onChange={e => setCity(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="New York" required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
                        <input value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="USA" required />
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
                <h2 className="text-lg font-bold text-gray-900">Residence History</h2>
                {entries.map((entry, i) => (
                    <motion.div key={entry.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                                <Home size={20} />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900">{entry.address}</h3>
                                <p className="text-xs text-gray-500">{entry.city}, {entry.country}</p>
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
