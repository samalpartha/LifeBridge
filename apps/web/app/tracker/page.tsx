"use client";

import { motion } from "framer-motion";
import { Calendar, FileText, Globe, Clock, Plus, Download, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trackerApi, TaskEntry } from "../../features/tracker/api/client";

export default function TrackerDashboard() {
    const [tasks, setTasks] = useState<TaskEntry[]>([]);

    useEffect(() => {
        trackerApi.getTasks().then(setTasks).catch(console.error);
    }, []);

    const dueSoon = tasks
        .filter(t => t.status !== 'completed' && t.due_date)
        .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
        .slice(0, 3);

    const stats = [
        { label: "Active Tasks", value: String(tasks.filter(t => t.status !== 'completed').length), icon: Calendar, color: "bg-blue-500" },
        { label: "Documents", value: "8", icon: FileText, color: "bg-purple-500" }, // Mock val for now
        { label: "Pending", value: String(tasks.filter(t => t.status === 'pending').length), icon: Clock, color: "bg-orange-500" },
        { label: "Timeline", value: "On Track", icon: Globe, color: "bg-green-500" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Immigration Tracker</h1>
                        <p className="text-gray-500 mt-1">Manage your history, documents, and compliance.</p>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href="/api/tracker/export/pdf"
                            target="_blank"
                            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                        >
                            <Download size={18} />
                            Export Report
                        </a>
                        <Link href="/tracker/history">
                            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                <Plus size={18} />
                                Log Entry
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats.map((stat, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                        >
                            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                                <stat.icon size={24} />
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent History</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Globe className="text-blue-500" size={20} />
                                    <div>
                                        <p className="font-medium text-gray-900">Trip to France</p>
                                        <p className="text-xs text-gray-500">Dec 10 - Dec 24, 2024</p>
                                    </div>
                                </div>
                                <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded">Verified</span>
                            </div>
                            {/* Placeholder for real data */}
                            <div className="text-center py-4 text-gray-400 text-sm">
                                <Link href="/tracker/history" className="hover:text-blue-600 underline">View all history</Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertCircle size={20} className="text-blue-600" />
                            Upcoming Deadlines
                        </h2>
                        <div className="space-y-4">
                            {dueSoon.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No upcoming deadlines.</p>
                            ) : (
                                dueSoon.map(task => (
                                    <div key={task.id} className="flex items-center justify-between p-4 border border-blue-50 bg-blue-50/30 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                            <div>
                                                <p className="font-medium text-gray-900 line-through-none">{task.title}</p>
                                                <p className="text-xs text-blue-600">Due: {task.due_date}</p>
                                            </div>
                                        </div>
                                        <Link href="/tracker/tasks">
                                            <button className="text-xs bg-white border border-gray-200 px-3 py-1 rounded hover:bg-gray-50">View</button>
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
