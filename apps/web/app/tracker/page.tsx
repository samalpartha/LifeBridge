"use client";

import { motion } from "framer-motion";
import {
    Activity,
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    FileText,
    Globe,
    Plus,
    RefreshCcw,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trackerApi, TaskEntry } from "../../features/tracker/api/client";
import { LiveRuntimeCard } from "../components/LiveRuntimeCard";
import toast from "react-hot-toast";

export default function TrackerDashboard() {
    const [tasks, setTasks] = useState<TaskEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
    const [now, setNow] = useState<number>(Date.now());

    useEffect(() => {
        let active = true;

        const loadTasks = async () => {
            try {
                const data = await trackerApi.getTasks();
                if (!active) return;
                setTasks(data);
                setLastUpdatedAt(Date.now());
            } catch {
                if (!active) return;
                toast.error("Unable to refresh live task data right now.");
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadTasks();
        const tasksInterval = window.setInterval(() => {
            void loadTasks();
        }, 60000);
        const clockInterval = window.setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => {
            active = false;
            window.clearInterval(tasksInterval);
            window.clearInterval(clockInterval);
        };
    }, []);

    const dueSoon = tasks
        .filter((task) => task.status !== "completed" && task.due_date)
        .sort((a, b) => new Date(a.due_date || "").getTime() - new Date(b.due_date || "").getTime())
        .slice(0, 3);

    const syncLabel = (() => {
        if (!lastUpdatedAt) return "Waiting for first sync";
        const seconds = Math.max(Math.floor((now - lastUpdatedAt) / 1000), 0);
        if (seconds < 60) return `${seconds}s ago`;
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
    })();

    const stats = [
        { label: "Active Tasks", value: String(tasks.filter((task) => task.status !== "completed").length), icon: Calendar, color: "bg-blue-500" },
        { label: "Due Soon", value: String(dueSoon.length), icon: Clock, color: "bg-orange-500" },
        { label: "Completed", value: String(tasks.filter((task) => task.status === "completed").length), icon: CheckCircle, color: "bg-emerald-500" },
        { label: "Sync Age", value: syncLabel, icon: RefreshCcw, color: "bg-indigo-500" },
    ];

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <div className="glass-panel shimmer-border animate-enter border-indigo-100 bg-gradient-to-br from-white via-indigo-50/30 to-cyan-50/20 p-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                    <span className="relative inline-flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <Activity size={14} />
                    Case Workspace Live
                </div>
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Immigration Tracker</h1>
                        <p className="mt-2 max-w-2xl text-gray-600">
                            Keep case evidence, timeline, and deadlines organized with live status visibility for every critical step.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
                                <RefreshCcw className="h-3 w-3" />
                                Last sync: {syncLabel}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700">
                                <Clock className="h-3 w-3" />
                                <span suppressHydrationWarning>{new Date(now).toLocaleTimeString()}</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href="/crisis-home"
                            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-red-700 transition hover:bg-red-100"
                        >
                            <AlertCircle size={18} />
                            Crisis Corridor
                        </Link>
                        <a
                            href="/api/tracker/export/pdf"
                            target="_blank"
                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-gray-700 transition hover:bg-gray-50"
                        >
                            <Download size={18} />
                            Export Report
                        </a>
                        <Link
                            href="/tracker/history"
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                        >
                            <Plus size={18} />
                            Log Entry
                        </Link>
                    </div>
                </div>
            </div>

            <LiveRuntimeCard />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="surface-card animate-enter stagger-1 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step 1</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">Capture your history</p>
                    <p className="mt-1 text-sm text-gray-600">Log travel, residence, and work records under Timeline.</p>
                </div>
                <div className="surface-card animate-enter stagger-2 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step 2</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">Track critical deadlines</p>
                    <p className="mt-1 text-sm text-gray-600">Use tasks to keep appointments, filings, and reminders visible.</p>
                </div>
                <div className="surface-card animate-enter stagger-3 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Step 3</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">Export and share evidence</p>
                    <p className="mt-1 text-sm text-gray-600">Generate reports to share with attorneys and support teams.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                        className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                    >
                        <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-white ${stat.color}`}>
                            <stat.icon size={22} />
                        </div>
                        <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="surface-card animate-enter stagger-1 p-6">
                    <h2 className="mb-4 text-lg font-bold text-gray-900">Task Pulse</h2>
                    {loading ? (
                        <p className="text-sm text-gray-500">Loading task status...</p>
                    ) : tasks.length === 0 ? (
                        <p className="text-sm italic text-gray-500">No tasks yet. Add one in Tasks to start tracking.</p>
                    ) : (
                        <ul className="space-y-3">
                            {tasks.slice(0, 5).map((task) => (
                                <li key={task.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-medium text-slate-900">{task.title}</p>
                                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                            task.status === "completed"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : task.status === "in_progress"
                                                  ? "bg-blue-100 text-blue-700"
                                                  : "bg-amber-100 text-amber-700"
                                        }`}>
                                            {task.status.replace("_", " ")}
                                        </span>
                                    </div>
                                    {task.due_date ? (
                                        <p className="mt-1 text-xs text-slate-500">Due {task.due_date}</p>
                                    ) : (
                                        <p className="mt-1 text-xs text-slate-400">No due date set</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="mt-4">
                        <Link href="/tracker/tasks" className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                            Open full task board →
                        </Link>
                    </div>
                </div>

                <div className="surface-card animate-enter stagger-2 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
                        <AlertCircle size={20} className="text-blue-600" />
                        Upcoming Deadlines
                    </h2>
                    <div className="space-y-4">
                        {dueSoon.length === 0 ? (
                            <p className="text-sm italic text-gray-500">No upcoming deadlines.</p>
                        ) : (
                            dueSoon.map((task) => (
                                <div key={task.id} className="flex items-center justify-between rounded-lg border border-blue-50 bg-blue-50/40 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full ${task.priority === "high" ? "bg-red-500" : "bg-blue-500"}`} />
                                        <div>
                                            <p className="font-medium text-gray-900">{task.title}</p>
                                            <p className="text-xs text-blue-600">Due: {task.due_date}</p>
                                        </div>
                                    </div>
                                    <Link href="/tracker/tasks" className="rounded border border-gray-200 bg-white px-3 py-1 text-xs hover:bg-gray-50">
                                        View
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Globe className="text-blue-500" size={16} />
                            Timeline Continuity
                        </h3>
                        <p className="text-sm text-gray-600">
                            Keep travel and residence history complete so legal teams can act quickly when deadlines change.
                        </p>
                        <Link href="/tracker/history" className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:text-blue-800">
                            View timeline history →
                        </Link>
                    </div>
                </div>
            </div>

            <div className="surface-card animate-enter stagger-3 p-6">
                <h2 className="mb-4 text-lg font-bold text-gray-900">Quick Evidence Snapshot</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Travel logs</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">1</p>
                        <p className="text-xs text-slate-500">Recent entries ready for review</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</p>
                        <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900">
                            <FileText className="h-5 w-5 text-violet-600" />
                            Vault connected
                        </p>
                        <p className="text-xs text-slate-500">Store copies with verified metadata</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Case status</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-700">On Track</p>
                        <p className="text-xs text-slate-500">Maintain tasks and timeline consistency</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
