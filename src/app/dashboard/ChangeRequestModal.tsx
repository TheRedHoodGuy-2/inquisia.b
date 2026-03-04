"use client";

import { useState } from "react";

interface ChangeRequestModalProps {
    project: any;
    onClose: () => void;
    onSuccess: () => void;
}

const CHECKLIST_ITEMS = [
    "Title",
    "Abstract",
    "Tags",
    "GitHub URL",
    "Live URL",
    "PDF Report",
    "Presentation File"
];

export default function ChangeRequestModal({ project, onClose, onSuccess }: ChangeRequestModalProps) {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [reason, setReason] = useState("");
    const [proposedData, setProposedData] = useState<any>({
        title: project.title,
        abstract: project.abstract,
        github_url: project.github_url || "",
        live_url: project.live_url || "",
        student_tags: project.student_tags || []
    });
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleField = (field: string) => {
        if (selectedFields.includes(field)) {
            setSelectedFields(selectedFields.filter(f => f !== field));
        } else {
            setSelectedFields([...selectedFields, field]);
        }
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFields.length === 0) {
            setError("Please select at least one field to change.");
            return;
        }
        if (!reason.trim()) {
            setError("Please provide a reason for the change.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("fields", JSON.stringify(selectedFields));
            formData.append("reason", reason);
            formData.append("proposedData", JSON.stringify(proposedData));
            if (reportFile) {
                formData.append("reportFile", reportFile);
            }

            const res = await fetch(`/api/projects/${project.id}/change-request`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || "Failed to submit change request.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Request Changes</h2>
                        <p className="text-sm text-gray-500 font-medium">Approved projects require formal review for modifications.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleInviteSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Part 1: Checklist */}
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">1. What do you want to change?</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {CHECKLIST_ITEMS.map(item => (
                                <button
                                    key={item}
                                    type="button"
                                    onClick={() => toggleField(item)}
                                    className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all text-left flex items-center justify-between ${selectedFields.includes(item)
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {item}
                                    {selectedFields.includes(item) && (
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Part 2: Reason */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">2. Why do you want to change it?</label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Explain the reason for these changes (e.g., corrected abstract, updated live demo link...)"
                            className="w-full px-4 py-3 rounded-2xl border-gray-200 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] text-sm font-medium"
                            required
                        />
                    </div>

                    {/* Part 3: New Content (Conditional) */}
                    {selectedFields.length > 0 && (
                        <div className="space-y-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
                            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest block">3. Provide New Content</label>

                            {selectedFields.includes("Title") && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600">New Title</label>
                                    <input
                                        type="text"
                                        value={proposedData.title}
                                        onChange={e => setProposedData({ ...proposedData, title: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border-gray-200 text-sm font-bold"
                                    />
                                </div>
                            )}

                            {selectedFields.includes("Abstract") && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600">New Abstract</label>
                                    <textarea
                                        value={proposedData.abstract}
                                        onChange={e => setProposedData({ ...proposedData, abstract: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border-gray-200 text-sm font-medium min-h-[150px]"
                                    />
                                </div>
                            )}

                            {selectedFields.includes("GitHub URL") && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600">New GitHub URL</label>
                                    <input
                                        type="url"
                                        value={proposedData.github_url}
                                        onChange={e => setProposedData({ ...proposedData, github_url: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border-gray-200 text-sm font-medium"
                                    />
                                </div>
                            )}

                            {selectedFields.includes("PDF Report") && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-600">New PDF Report</label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={e => setReportFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium italic">* Plagiarism check will run automatically upon submission.</p>
                                </div>
                            )}

                            {/* Add other fields as needed... matching the checklist */}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            {error}
                        </div>
                    )}
                </form>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-white transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleInviteSubmit}
                        disabled={submitting}
                        className="flex-1 px-6 py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold shadow-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Submitting...
                            </>
                        ) : (
                            "Submit Change Request"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
