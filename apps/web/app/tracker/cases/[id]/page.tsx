"use client";

import { useState, useEffect } from "react";
import {
    ArrowLeft,
    Calendar,
    FileText,
    CheckCircle,
    Clock,
    RefreshCw,
    AlertCircle,
    X,
    Edit,
    Upload,
    Trash2
} from "lucide-react";
import { trackerApi, CaseEntry, CaseEventEntry } from "@/features/tracker/api/client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CaseDashboard() {
    const router = useRouter();
    const params = useParams();
    const idParam = params?.id;
    const caseId = idParam ? parseInt(Array.isArray(idParam) ? idParam[0] : idParam) : 0;
    const [caseData, setCaseData] = useState<CaseEntry | null>(null);
    const [events, setEvents] = useState<CaseEventEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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

    const handleUpdateCase = async (updatedCase: CaseEntry) => {
        try {
            // Sanitize
            if (updatedCase.filing_date === "") updatedCase.filing_date = undefined;
            if (updatedCase.priority_date === "") updatedCase.priority_date = undefined;

            await trackerApi.updateCase(caseId, updatedCase);
            toast.success("Case updated successfully");
            setIsEditModalOpen(false);
            refreshCase();
        } catch (e) {
            toast.error("Failed to update case");
        }
    };

    const handleUploadDoc = async (file: File) => {
        try {
            await trackerApi.addDocument({
                filename: file.name,
                category: "Case Evidence",
                case_id: caseId
            });
            toast.success("Document linked to case");
            setIsDocModalOpen(false);
        } catch (e) {
            toast.error("Failed to upload document");
        }
    };

    const handleDeleteCase = async () => {
        if (!confirm("Are you sure you want to delete this case? This action cannot be undone.")) return;
        try {
            await trackerApi.deleteCase(caseId);
            toast.success("Case deleted");
            router.push("/tracker/cases");
        } catch (e) {
            toast.error("Failed to delete case");
        }
    };

    const handleAddTask = async (task: any) => {
        try {
            await trackerApi.addTask(task);
            toast.success("Task created");
            setIsTaskModalOpen(false);
        } catch (e) {
            toast.error("Failed to create task");
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

                            {/* Delete Button */}
                            <button
                                onClick={handleDeleteCase}
                                className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                            >
                                <Trash2 size={14} /> Delete
                            </button>

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
                        {/* List Documents? For now just count or empty state */}
                        <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                            No documents linked.
                            <br />
                            <button
                                onClick={() => setIsDocModalOpen(true)}
                                className="text-blue-600 font-medium hover:underline mt-2"
                            >
                                Upload Linked Doc
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle size={18} /> Linked Tasks
                        </h3>
                        {/* List Tasks? For now just count or empty state */}
                        <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                            No active tasks.
                            <br />
                            <button
                                onClick={() => setIsTaskModalOpen(true)}
                                className="text-blue-600 font-medium hover:underline mt-2"
                            >
                                Add Task
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Edit Case Modal */}
            {isEditModalOpen && caseData && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-scale-in">
                        <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-4">Edit Case Details</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleUpdateCase({
                                ...caseData,
                                receipt_number: formData.get('receipt_number') as string,
                                filing_date: formData.get('filing_date') as string,
                                priority_date: formData.get('priority_date') as string,
                                status: formData.get('status') as string
                            });
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Receipt Number</label>
                                <input name="receipt_number" defaultValue={caseData.receipt_number || ''} className="w-full border rounded p-2" placeholder="e.g. IOE123..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Filing Date</label>
                                <input type="date" name="filing_date" defaultValue={caseData.filing_date} className="w-full border rounded p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Priority Date</label>
                                <input type="date" name="priority_date" defaultValue={caseData.priority_date} className="w-full border rounded p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status</label>
                                <select name="status" defaultValue={caseData.status} className="w-full border rounded p-2">
                                    <option>Open</option>
                                    <option>Pending</option>
                                    <option>Case Received</option>
                                    <option>Request for Evidence</option>
                                    <option>Approved</option>
                                    <option>Closed</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Document Upload Modal (Reuse Logic) */}
            {isDocModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-scale-in">
                        <button onClick={() => setIsDocModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-4">Upload Linked Document</h3>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center bg-gray-50">
                                <input type="file" className="hidden" id="doc-upload"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleUploadDoc(e.target.files[0]);
                                    }}
                                />
                                <label htmlFor="doc-upload" className="cursor-pointer text-blue-600 font-medium hover:underline">
                                    Click to select file
                                </label>
                                <p className="text-xs text-gray-500 mt-2">PDF, PNG, JPG (Max 10MB)</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Creation Modal */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative animate-scale-in">
                        <button onClick={() => setIsTaskModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        <h3 className="text-xl font-bold mb-4">Add Linked Task</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleAddTask({
                                title: formData.get('title') as string,
                                status: 'pending',
                                priority: 'medium',
                                case_id: caseId
                            });
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Task Title</label>
                                <input name="title" required className="w-full border rounded p-2" placeholder="e.g. Gather tax returns" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
