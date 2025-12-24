"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, FileText, CheckCircle, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { trackerApi, CaseEntry, CaseEventEntry } from "@/features/tracker/api/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CaseDashboard({ params }: { params: { id: string } }) {
    const caseId = parseInt(params.id);
    const [caseData, setCaseData] = useState<CaseEntry | null>(null);
    const [events, setEvents] = useState<CaseEventEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingStatus, setCheckingStatus] = useState(false);

    const refreshCase = () => {
        if (caseId) {
            Promise.all([
                trackerApi.getCase(caseId),
                trackerApi.getCaseEvents(caseId)
            ]).then(([c, e]) => {
                setCaseData(c);
                setEvents(e);
                setLoading(false);
            }).catch(console.error);
        }
    };

    useEffect(() => {
        refreshCase();
    }, [caseId]);

    const handleCheckStatus = async () => {
        if (!caseData?.receipt_number) {
            toast.error("Please add a receipt number first.");
            return;
        }

        setCheckingStatus(true);
        try {
            const result = await trackerApi.checkCaseStatus(caseId);
            toast.success(`Status: ${result.uscis_status.status}`);
            refreshCase(); // Reload to see new status/event
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setCheckingStatus(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'open': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            case 'case received': return 'bg-blue-100 text-blue-700';
            case 'request for evidence': return 'bg-orange-100 text-orange-700';
            case 'approved': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) return <div className="p-8">Loading case...</div>;
    if (!caseData) return <div className="p-8">Case not found.</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <Link href="/tracker/cases" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 w-fit">
                        <ArrowLeft size={16} className="mr-2" /> Back to Cases
                    </Link>

                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{caseData.title}</h1>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(caseData.status)}`}>
                                    {caseData.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-600">
                                <p>Case Type: <span className="font-medium text-gray-900">{caseData.case_type}</span></p>
                                {caseData.receipt_number && (
                                    <p className="flex items-center gap-1">
                                        Receipt #: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{caseData.receipt_number}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                            {caseData.receipt_number ? (
                                <button
                                    onClick={handleCheckStatus}
                                    disabled={checkingStatus}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {checkingStatus ? (
                                        <RefreshCw size={18} className="animate-spin" />
                                    ) : (
                                        <RefreshCw size={18} />
                                    )}
                                    {checkingStatus ? 'Checking USCIS...' : 'Check Status'}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm border border-amber-200">
                                    <AlertCircle size={16} />
                                    <span>Add Receipt # to track</span>
                                </div>
                            )}

                            <div className="text-right text-sm text-gray-500 space-y-1">
                                {caseData.filing_date && (
                                    <p>Filed: <span className="font-medium text-gray-900">{caseData.filing_date}</span></p>
                                )}
                                {caseData.priority_date && (
                                    <p>Priority: <span className="font-medium text-gray-900">{caseData.priority_date}</span></p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Timeline (The Spine) */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="text-blue-600" /> Case Timeline
                    </h2>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pl-8 py-2">
                            {events.length === 0 && <p className="text-gray-400 italic">No events recorded yet.</p>}

                            {events.map((evt, idx) => (
                                <div key={idx} className="relative group">
                                    <div className={`absolute -left-[41px] h-6 w-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center
                                        ${evt.event_type === 'status_update' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                    />
                                    <div className="bg-white p-4 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{evt.event_date}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium
                                                ${evt.event_type === 'status_update' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {evt.event_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{evt.title}</h3>
                                        <p className="text-gray-600 mt-1 text-sm leading-relaxed">{evt.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText size={18} /> Linked Documents
                        </h3>
                        <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                            No documents linked.
                            <br />
                            <button className="text-blue-600 font-medium hover:underline mt-2">Upload Linked Doc</button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle size={18} /> Linked Tasks
                        </h3>
                        <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                            No active tasks.
                            <br />
                            <button className="text-blue-600 font-medium hover:underline mt-2">Add Task</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
