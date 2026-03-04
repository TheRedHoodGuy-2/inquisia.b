"use client";

import { useState, useEffect } from "react";

interface Author {
    student: {
        id: string;
        full_name: string;
        display_name: string;
        matric_no: string;
    };
    role_description: string;
}

interface Project {
    id: string;
    title: string;
    abstract: string;
    report_url: string;
    github_url?: string;
    live_url?: string;
    presentation_url?: string;
    status: string;
    plagiarism_score: number;
    ai_category: string;
    created_at: string;
    version: number;
    authors?: Author[];
}

interface ReviewModalProps {
    project: Project;
    onClose: () => void;
    onStatusUpdate: () => void;
}

export default function ReviewModal({ project, onClose, onStatusUpdate }: ReviewModalProps) {
    const [status, setStatus] = useState<"approved" | "changes_requested" | "rejected">("approved");
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [showVersions, setShowVersions] = useState(false);

    useEffect(() => {
        if (showVersions && versions.length === 0) {
            fetch(`/api/projects/${project.id}/versions`)
                .then(res => res.json())
                .then(data => { if (data.success) setVersions(data.data); });
        }
    }, [showVersions, project.id, versions.length]);

    const handleStatusUpdate = async (newStatus: "approved" | "changes_requested" | "rejected") => {
        if (!feedback.trim()) {
            setError("Please provide feedback for the student.");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const res = await fetch(`/api/projects/${project.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, feedback })
            });

            const data = await res.json();
            if (data.success) {
                onStatusUpdate();
                onClose();
            } else {
                setError(data.error || "Failed to update project status.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred while updating the status.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`bg-white rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex animate-in fade-in zoom-in duration-200 transition-all ${showVersions ? 'max-w-6xl' : 'max-w-4xl'}`}>
                {/* Main Review Area */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Project Review</h2>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">v{project.version}</span>
                                {project.version > 1 && (
                                    <button
                                        onClick={() => setShowVersions(!showVersions)}
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {showVersions ? "Hide Timeline" : "View Evolution"}
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 font-medium">Evaluate the submission and provide constructive feedback.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Top Row: Plagiarism & Category */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">AI Category</span>
                                <p className="mt-1 text-lg font-bold text-blue-900">{project.ai_category}</p>
                            </div>
                            <div className={`rounded-xl p-4 border ${project.plagiarism_score > 30 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                <span className={`text-xs font-semibold uppercase tracking-wider ${project.plagiarism_score > 30 ? 'text-red-600' : 'text-green-600'}`}>Plagiarism Score</span>
                                <p className={`mt-1 text-lg font-bold ${project.plagiarism_score > 30 ? 'text-red-900' : 'text-green-900'}`}>{project.plagiarism_score}%</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-center">
                                <a href={project.report_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 underline decoration-2 underline-offset-4">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Download Report PDF
                                </a>
                            </div>
                        </div>

                        {/* Abstract */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-tight">Abstract</h3>
                            <div className="bg-gray-50 rounded-xl p-5 text-gray-700 text-sm leading-relaxed border border-gray-100 italic font-medium">
                                {project.abstract}
                            </div>
                        </div>

                        {/* Authors & Links */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-tight">Team Members</h3>
                                <div className="space-y-2">
                                    {project.authors?.map((auth, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{auth.student.full_name}</p>
                                                <p className="text-xs text-gray-500">{auth.student.matric_no}</p>
                                            </div>
                                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium uppercase tracking-widest">{auth.role_description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-tight">External Resources</h3>
                                <div className="space-y-3">
                                    {project.github_url && (
                                        <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                            <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                                            GitHub Repository
                                        </a>
                                    )}
                                    {project.live_url && (
                                        <a href={project.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            Live Demo
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Review Form */}
                        <div className="pt-8 border-t border-gray-100 space-y-6">
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Final Decision</h3>

                            <div className="space-y-3">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Update Status</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button type="button" onClick={() => setStatus("approved")} className={`px-4 py-4 rounded-2xl border-2 text-sm font-black transition-all flex items-center justify-center gap-2 ${status === 'approved' ? 'bg-green-600 border-green-600 text-white shadow-xl shadow-green-100 scale-[1.02]' : 'bg-white border-gray-200 text-gray-400 hover:border-green-200 hover:text-green-600'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Approve
                                    </button>
                                    <button type="button" onClick={() => setStatus("changes_requested")} className={`px-4 py-4 rounded-2xl border-2 text-sm font-black transition-all flex items-center justify-center gap-2 ${status === 'changes_requested' ? 'bg-yellow-500 border-yellow-500 text-white shadow-xl shadow-yellow-100 scale-[1.02]' : 'bg-white border-gray-200 text-gray-400 hover:border-yellow-200 hover:text-yellow-600'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Revision
                                    </button>
                                    <button type="button" onClick={() => setStatus("rejected")} className={`px-4 py-4 rounded-2xl border-2 text-sm font-black transition-all flex items-center justify-center gap-2 ${status === 'rejected' ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-100 scale-[1.02]' : 'bg-white border-gray-200 text-gray-400 hover:border-red-200 hover:text-red-600'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        Reject
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Supervisor feedback *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder="Provide detailed feedback for the student..."
                                    className="block w-full rounded-2xl border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-4 bg-gray-50/50 font-medium"
                                />
                            </div>

                            {error && <p className="text-sm font-bold text-red-500 flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-100">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                {error}
                            </p>}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={onClose} className="px-8 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(status)}
                                    disabled={isSubmitting}
                                    className="px-12 py-3 bg-gray-900 text-white text-sm font-black rounded-xl shadow-2xl hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Submitting...
                                        </>
                                    ) : "Confirm Decision"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Version History */}
                {showVersions && (
                    <div className="w-80 border-l border-gray-100 bg-gray-50/50 flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-gray-100 bg-white/50">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Version History</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {versions.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 italic text-xs">Loading history...</div>
                            ) : (
                                versions.map((v, i) => (
                                    <div key={v.id} className="relative pl-6 border-l-2 border-gray-200">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500" />
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-gray-900">v{v.version_number}</span>
                                                <span className="text-[10px] font-bold text-gray-400">{new Date(v.uploaded_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium line-clamp-3">Plagiarism: {v.plagiarism_score}%</p>
                                            {v.supervisor_feedback && (
                                                <div className="mt-2 p-2 bg-white rounded border border-gray-100 text-[10px] text-gray-600 font-medium italic">
                                                    "{v.supervisor_feedback}"
                                                </div>
                                            )}
                                            <a href={v.report_url} target="_blank" className="inline-block mt-2 text-[10px] font-black text-blue-600 hover:underline uppercase tracking-tighter">View Report</a>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
