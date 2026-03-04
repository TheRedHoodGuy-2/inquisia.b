"use client";

import { useState } from "react";

interface ChangeRequestReviewModalProps {
    request: any;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ChangeRequestReviewModal({ request, onClose, onSuccess }: ChangeRequestReviewModalProps) {
    const [response, setResponse] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResolve = async (status: "approved" | "denied") => {
        if (!response.trim()) {
            setError("Please provide a reason or response for this decision.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/change-requests/${request.id}/resolve`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status, response })
            });

            const data = await res.json();
            if (data.success) {
                onSuccess();
                onClose();
            } else {
                setError(data.error || "Failed to resolve request.");
            }
        } catch (err) {
            setError("An unexpected error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    const project = request.project;
    const proposed = request.proposed_data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Evaluate Change Request</h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Awaiting Review</span>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Review the proposed modifications and compare with current live data.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Comparison Area */}
                    <div className="space-y-8 lg:col-span-2">
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                            <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">Student's Reason for Change</h4>
                            <p className="text-sm text-blue-900 font-medium italic">"{request.reason}"</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center py-2 px-4 rounded-xl bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">Live Version</div>
                            <div className="text-center py-2 px-4 rounded-xl bg-purple-100 text-[10px] font-black text-purple-600 uppercase tracking-widest">Proposed Changes</div>
                        </div>

                        {request.fields.map((field: string) => {
                            const fieldKeyMap: any = {
                                "Title": "title",
                                "Abstract": "abstract",
                                "GitHub URL": "github_url",
                                "Live URL": "live_url",
                                "Tags": "student_tags"
                            };
                            const key = fieldKeyMap[field];
                            if (!key && field !== "PDF Report") return null;

                            return (
                                <div key={field} className="space-y-3">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{field}</label>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-500 line-clamp-6">
                                            {field === "PDF Report" ? (
                                                <a href={project.report_url} target="_blank" className="text-blue-600 hover:underline">View Current PDF</a>
                                            ) : (
                                                project[key] || <span className="italic">N/A</span>
                                            )}
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white border-2 border-purple-100 text-sm font-bold text-gray-900 shadow-sm ring-1 ring-purple-50 line-clamp-6">
                                            {field === "PDF Report" ? (
                                                <div className="space-y-2">
                                                    <a href={request.new_report_url} target="_blank" className="text-purple-600 hover:underline">View New PDF</a>
                                                    <div className="pt-2 border-t border-purple-50">
                                                        <p className="text-[10px] font-black text-purple-400 uppercase">New Plagiarism Score</p>
                                                        <p className={`text-lg font-black ${request.new_plagiarism_score > 30 ? 'text-red-500' : 'text-green-500'}`}>
                                                            {request.new_plagiarism_score}%
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                Array.isArray(proposed[key]) ? proposed[key].join(", ") : (proposed[key] || <span className="italic">N/A</span>)
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-8 border-t border-gray-100 bg-gray-50 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Your Response / Reason for Acceptance or Denial</label>
                        <textarea
                            value={response}
                            onChange={e => setResponse(e.target.value)}
                            placeholder="Provide feedback to the student..."
                            className="w-full px-4 py-3 rounded-2xl border-gray-200 focus:ring-purple-500 focus:border-purple-500 text-sm font-medium min-h-[100px]"
                        />
                    </div>

                    {error && <p className="text-xs font-bold text-red-500">{error}</p>}

                    <div className="flex gap-4">
                        <button
                            onClick={() => handleResolve("denied")}
                            disabled={submitting}
                            className="flex-1 px-8 py-4 rounded-2xl border-2 border-red-100 text-red-600 text-sm font-black hover:bg-red-50 transition-all uppercase tracking-widest disabled:opacity-50"
                        >
                            Deny Changes
                        </button>
                        <button
                            onClick={() => handleResolve("approved")}
                            disabled={submitting}
                            className="flex-1 px-8 py-4 rounded-2xl bg-gray-900 text-white text-sm font-black shadow-xl hover:bg-black transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? "Processing..." : "Approve & Update Live"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
