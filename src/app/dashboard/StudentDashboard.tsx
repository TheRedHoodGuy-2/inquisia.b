"use client";

import Link from "next/link";
import { useState } from "react";
import VersionHistory from "./VersionHistory";
import ChangeRequestModal from "./ChangeRequestModal";

export default function StudentDashboard({ projects: initialProjects }: { projects: any[] }) {
    const [projects, setProjects] = useState(initialProjects);
    const [selectedProjectForRequest, setSelectedProjectForRequest] = useState<any | null>(null);
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

    const handleWithdraw = async (requestId: string) => {
        if (!confirm("Are you sure you want to withdraw this change request?")) return;
        setWithdrawingId(requestId);
        try {
            const res = await fetch(`/api/change-requests/${requestId}/withdraw`, { method: "PATCH" });
            if (res.ok) {
                // Refresh local state if needed or just notify user
                window.location.reload();
            }
        } catch (error) {
            console.error("Withdrawal error:", error);
        } finally {
            setWithdrawingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Your Portfolio</h2>
                <Link
                    href="/upload"
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all text-center"
                >
                    Upload New Project
                </Link>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <svg className="mx-auto h-16 w-16 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <h3 className="mt-4 text-lg font-bold text-gray-900">No projects yet</h3>
                    <p className="mt-1 text-gray-500 font-medium">Get started by uploading your final year project.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {projects.map((project) => {
                        const hasPendingRequest = project.change_requests?.some((r: any) => r.status === 'pending');
                        const pendingRequest = project.change_requests?.find((r: any) => r.status === 'pending');

                        return (
                            <div key={project.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${project.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    project.status === 'pending' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        project.status === 'changes_requested' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                            'bg-red-100 text-red-700 border-red-200'
                                                }`}>
                                                {project.status.replace('_', ' ')}
                                            </span>
                                            {project.version > 1 && (
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">v{project.version}</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-400 font-medium">Submitted {new Date(project.created_at).toLocaleDateString()}</p>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">{project.title}</h3>
                                        <p className="mt-2 text-sm text-gray-500 font-medium line-clamp-2">{project.abstract}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <span className="flex items-center gap-1.5 border-r border-gray-100 pr-4">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            {project.supervisor?.full_name || "Assigned"}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            {project.plagiarism_score}% Plagiarism
                                        </span>
                                    </div>

                                    {project.supervisor_feedback && (
                                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
                                            <p className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest mb-1">Supervisor Notes</p>
                                            <p className="text-sm text-yellow-900 font-medium italic">"{project.supervisor_feedback}"</p>
                                        </div>
                                    )}

                                    <VersionHistory projectId={project.id} />
                                </div>

                                <div className="md:w-56 flex flex-col gap-3 justify-center items-stretch bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50">
                                    {project.status === 'pending' && (
                                        <Link href={`/upload?edit=${project.id}`} className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Edit Submission
                                        </Link>
                                    )}

                                    {project.status === 'changes_requested' && (
                                        project.version < 3 ? (
                                            <Link href={`/upload?revision=${project.id}`} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                                                Submit Revision
                                            </Link>
                                        ) : (
                                            <div className="p-3 bg-red-50 rounded-2xl border border-red-100 text-center">
                                                <p className="text-[10px] font-bold text-red-700 uppercase leading-tight">Version Limit Reached</p>
                                                <p className="text-[9px] text-red-600 font-semibold mt-1 italic">Delete and start a new project to continue.</p>
                                            </div>
                                        )
                                    )}

                                    {project.status === 'rejected' && (
                                        <Link href={`/upload?resubmit=${project.id}`} className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold hover:bg-black transition-all">
                                            Resubmit Project
                                        </Link>
                                    )}

                                    {project.status === 'approved' && (
                                        !hasPendingRequest ? (
                                            <button onClick={() => setSelectedProjectForRequest(project)} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-2xl text-sm font-bold hover:bg-blue-100 transition-all border border-blue-100">
                                                Request Changes
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-100 text-center flex flex-col items-center gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                                                        <span className="text-[10px] font-bold text-yellow-700 uppercase">Awaiting Response</span>
                                                    </div>
                                                    <p className="text-[9px] text-yellow-600 font-medium">Change Request Pending</p>
                                                </div>
                                                <button
                                                    onClick={() => handleWithdraw(pendingRequest.id)}
                                                    disabled={withdrawingId === pendingRequest.id}
                                                    className="w-full text-center text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest disabled:opacity-50"
                                                >
                                                    {withdrawingId === pendingRequest.id ? "Withdrawing..." : "Withdraw Request"}
                                                </button>
                                            </div>
                                        )
                                    )}

                                    <Link href={`/projects/${project.id}`} className="text-center text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest mt-2 py-1">
                                        View Public Page
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedProjectForRequest && (
                <ChangeRequestModal
                    project={selectedProjectForRequest}
                    onClose={() => setSelectedProjectForRequest(null)}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </div>
    );
}

