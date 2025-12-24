"use client";

import { useState, useRef } from "react";
import { CHECKLIST_PATHS, ChecklistPath, ChecklistItem } from "./data";
import { ArrowRight, CheckCircle, Circle, FolderOpen, Calendar, BookOpen, Upload, Briefcase, GraduationCap, Globe } from "lucide-react";
import { trackerApi } from "../../../features/tracker/api/client";
import toast from "react-hot-toast";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ChecklistPage() {
    const [path, setPath] = useState<ChecklistPath | null>(null);
    const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
    const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
    const router = useRouter();
    const hiddenInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simulate upload
        const toastId = toast.loading("Uploading document...");
        setTimeout(() => {
            toast.dismiss(toastId);
            toast.success(`Uploaded ${file.name}`);
            if (selectedItem) {
                setCompletedItems(prev => new Set(prev).add(selectedItem.id));
            }
        }, 1500);
    };

    const handleExport = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1000)),
            {
                loading: 'Preparing PDF...',
                success: () => {
                    window.print();
                    return 'Export ready';
                },
                error: 'Export failed'
            }
        );
    };

    // Calculate progress
    const totalSteps = path ? path.sections.flatMap(s => s.items).length : 0;
    const completedCount = completedItems.size;
    const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

    // Wizard Selection
    if (!path) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">What's your goal?</h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                            Select your path to generate a personalized immigration checklist with tasks and evidence tracking.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {Object.values(CHECKLIST_PATHS).map((p) => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    console.log("Path selected:", p.id);
                                    if (p.sections.length > 0 && p.sections[0].items.length > 0) {
                                        setPath(p);
                                        setSelectedItem(p.sections[0].items[0]);
                                    } else {
                                        console.error("Path has no items");
                                    }
                                }}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-left hover:border-blue-500 hover:ring-2 hover:ring-blue-500/20 transition group cursor-pointer w-full"
                            >
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    {p.id === 'work' && <Briefcase size={24} />}
                                    {p.id === 'study' && <GraduationCap size={24} />}
                                    {p.id === 'nomad' && <Globe size={24} />}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{p.label}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
                            </button>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <p className="text-xs text-gray-400">Content adapted from awesome-immigration by AwesomeVisa.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/knowledge">
                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                                <ArrowRight className="rotate-180" size={20} />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">{path.label} Checklist</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span className="text-green-600 font-medium">{completedCount} of {totalSteps} completed</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPath(null)}
                            className="text-sm text-gray-500 hover:text-gray-900 px-3 py-2"
                        >
                            Change Path
                        </button>
                        <button
                            onClick={handleExport}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2"
                        >
                            Export PDF
                        </button>
                    </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-100">
                    <div
                        className="h-full bg-green-500 transition-all duration-500 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-100px)]">

                {/* Left: Sections & Navigation */}
                <div className="lg:col-span-3 space-y-8 overflow-y-auto pr-2">
                    {path.sections.map((section) => (
                        <div key={section.id}>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isSelected = selectedItem?.id === item.id;
                                    const isCompleted = completedItems.has(item.id);

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className={`w-full text-left px-3 py-3 rounded-r-lg text-sm flex items-start gap-3 transition border-l-4 ${isSelected
                                                ? 'bg-blue-50 border-blue-600 text-blue-900 font-medium'
                                                : 'border-transparent text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`mt-0.5 shrink-0 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                                                {isCompleted ? <CheckCircle size={16} /> : <Circle size={16} />}
                                            </div>
                                            <span className="line-clamp-2">{item.title}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Center: Item Detail */}
                <div className="lg:col-span-6 bg-white border border-gray-200 rounded-2xl shadow-sm p-8 h-fit">
                    {selectedItem && (
                        <div key={selectedItem.id} className="space-y-8 animate-in fade-in duration-300">
                            {/* Hidden Input for Uploads */}
                            <input
                                type="file"
                                ref={hiddenInputRef}
                                className="hidden"
                                onChange={handleUpload}
                            />

                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wide ${selectedItem.type === 'task' ? 'bg-orange-100 text-orange-700' :
                                        selectedItem.type === 'upload' ? 'bg-purple-100 text-purple-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {selectedItem.type === 'task' ? 'Action Task' :
                                            selectedItem.type === 'upload' ? 'Document Upload' : 'Info'}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedItem.title}</h2>
                                <p className="text-gray-600 text-lg leading-relaxed">{selectedItem.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold text-sm">
                                        <BookOpen size={16} className="text-blue-500" />
                                        Why this matters
                                    </div>
                                    <p className="text-sm text-gray-600">{selectedItem.whyItMatters}</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2 text-gray-900 font-semibold text-sm">
                                        <Calendar size={16} className="text-green-500" />
                                        Time Estimate
                                    </div>
                                    <p className="text-sm text-gray-600">{selectedItem.timeEstimate}</p>
                                </div>
                            </div>

                            {selectedItem.typicalDocuments && (
                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Typical Documents</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedItem.typicalDocuments.map(doc => (
                                            <span key={doc} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                                                <FolderOpen size={12} />
                                                {doc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    onClick={async () => {
                                        if (selectedItem.type === 'upload') {
                                            hiddenInputRef.current?.click();
                                            return;
                                        }

                                        // Default task logic
                                        try {
                                            await trackerApi.addTask({
                                                title: selectedItem.title,
                                                description: selectedItem.description,
                                                status: 'pending',
                                                priority: 'medium'
                                            });
                                            toast.success("Added to Tasks");
                                            setCompletedItems(prev => new Set(prev).add(selectedItem.id));
                                        } catch (e) {
                                            toast.error("Failed to add task");
                                        }
                                    }}
                                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                                >
                                    {selectedItem.type === 'upload' ? <Upload size={18} /> : <CheckCircle size={18} />}
                                    {selectedItem.actionLabel || "Mark Complete"}
                                </button>

                                {selectedItem.type === 'upload' && (
                                    <div className="text-xs text-center text-gray-400 mt-2">
                                        Supported: PDF, JPG, PNG (Max 10MB)
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Context & Help */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                        <h4 className="font-bold text-yellow-900 text-sm mb-2 flex items-center gap-2">
                            <Briefcase size={16} /> Legal Context
                        </h4>
                        <p className="text-yellow-800 text-xs leading-relaxed">
                            This step often varies by consulate. Check specifically for <strong>{path.label}</strong> requirements in your destination country.
                        </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h4 className="font-bold text-gray-900 text-sm mb-4">Need Professional Help?</h4>
                        <p className="text-gray-500 text-xs mb-4">
                            Immigration rules change frequently. Connect with a verified attorney to review your documents.
                        </p>
                        <Link href="/attorneys" className="block w-full text-center bg-gray-50 text-blue-600 font-medium py-2 rounded-lg text-xs hover:bg-blue-50 transition border border-gray-200">
                            Find Attorney
                        </Link>
                    </div>
                </div>

            </div>
        </div >
    );
}
