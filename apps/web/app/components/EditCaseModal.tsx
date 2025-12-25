
import { useState, useEffect } from "react";
import { CaseEntry } from "@/features/tracker/api/client";

interface EditCaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: CaseEntry) => void;
    initialData: CaseEntry | null;
}

export default function EditCaseModal({ isOpen, onClose, onSave, initialData }: EditCaseModalProps) {
    const [title, setTitle] = useState("");
    const [receiptNumber, setReceiptNumber] = useState("");
    const [caseType, setCaseType] = useState("");

    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title);
            setReceiptNumber(initialData.receipt_number || "");
            setCaseType(initialData.case_type);
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!initialData) return;

        onSave({
            ...initialData,
            title,
            receipt_number: receiptNumber,
            case_type: caseType
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-scale-in">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Case Details</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Case Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Number</label>
                        <input
                            type="text"
                            value={receiptNumber}
                            onChange={(e) => setReceiptNumber(e.target.value.toUpperCase())}
                            placeholder="IOE..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Case Type</label>
                        <select
                            value={caseType}
                            onChange={(e) => setCaseType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="I-130 (Petition for Alien Relative)">I-130 (Petition for Alien Relative)</option>
                            <option value="I-140 (Immigrant Petition for Alien Worker)">I-140 (Immigrant Petition for Alien Worker)</option>
                            <option value="I-485 (Adjustment of Status)">I-485 (Adjustment of Status)</option>
                            <option value="I-765 (Employment Authorization)">I-765 (Employment Authorization)</option>
                            <option value="I-90 (Application to Replace Permanent Resident Card)">I-90 (Application to Replace Permanent Resident Card)</option>
                            <option value="I-129 (Petition for a Nonimmigrant Worker)">I-129 (Petition for a Nonimmigrant Worker)</option>
                            <option value="I-129F (Petition for Alien Fiancé(e))">I-129F (Petition for Alien Fiancé(e))</option>
                            <option value="I-131 (Application for Travel Document)">I-131 (Application for Travel Document)</option>
                            <option value="I-539 (Application to Extend/Change Nonimmigrant Status)">I-539 (Application to Extend/Change Nonimmigrant Status)</option>
                            <option value="I-751 (Petition to Remove Conditions on Residence)">I-751 (Petition to Remove Conditions on Residence)</option>
                            <option value="N-400 (Application for Naturalization)">N-400 (Application for Naturalization)</option>
                            <option value="K-1 (Fiancé(e) Visa)">K-1 (Fiancé(e) Visa)</option>
                            <option value="B-1/B-2 (Visitor Visa)">B-1/B-2 (Visitor Visa)</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
