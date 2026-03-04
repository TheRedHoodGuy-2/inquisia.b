"use client";

import { useState, useEffect } from "react";
import ReviewModal from "@/components/ReviewModal";
import ChangeRequestReviewModal from "@/components/ChangeRequestReviewModal";

interface SupervisorDashboardProps {
    initialProjects: any[];
}

export default function SupervisorDashboard({ initialProjects }: SupervisorDashboardProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [changeRequests, setChangeRequests] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"projects" | "requests">("projects");
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [filter, setFilter] = useState<string>("all");

    const fetchData = async () => {
        try {
            const [pRes, crRes] = await Promise.all([
                fetch("/api/supervisor/projects"),
                fetch("/api/supervisor/change-requests")
            ]);
            const pData = await pRes.json();
            const crData = await crRes.json();
            if (pData.success) setProjects(pData.data);
            if (crData.success) setChangeRequests(crData.data);
        } catch (error) {
            console.error("Failed to refresh dashboard data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredProjects = projects.filter(p => {
        if (filter === "all") return true;
        return p.status === filter;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "approved": return "bg-green-100 text-green-700 border-green-200";
            case "changes_requested": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "rejected": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-blue-100 text-blue-700 border-blue-200";
        }
    };

    const getProjectLabel = (project: any) => {
        if (project.status === 'pending') {
            if (project.version === 1) return "New Submission";
            return `Revision v${project.version}`;
        }
        if (project.status === 'changes_requested') return "Changes Requested";
        return project.status.charAt(0).toUpperCase() + project.status.slice(1);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex gap-2">
                <button
                    onClick={() => setActiveTab("projects")}
                    className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all ${activeTab === 'projects' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Review Queue
                </button>
                <button
                    onClick={() => setActiveTab("requests")}
                    className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'requests' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Change Requests
                    {changeRequests.length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">{changeRequests.length}</span>
                    )}
                </button>
            </div>

            {activeTab === "projects" ? (
                <>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-black text-gray-900 px-2 uppercase tracking-tight">Assigned Submissions</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 font-bold uppercase tracking-widest px-2">Filter</span>
                            <select value={filter} onChange={e => setFilter(e.target.value)} className="text-sm rounded-lg border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 px-3 py-2 font-bold">
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="changes_requested">Changes Requested</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {filteredProjects.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest">Queue Empty</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredProjects.map((project) => (
                                <div key={project.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(project.status)}`}>
                                                {getProjectLabel(project)}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ID: {project.id.slice(0, 8)}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{project.title}</h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                {project.authors?.find((a: any) => a.role_description === 'Team Lead')?.student?.full_name || 'N/A'}
                                            </span>
                                            <span className="flex items-center gap-1.5 border-l border-gray-100 pl-4">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-center px-4 border-l border-gray-100 hidden sm:block">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Plagiarism</p>
                                            <p className={`text-xl font-black ${project.plagiarism_score > 30 ? 'text-red-500' : 'text-green-500'}`}>{project.plagiarism_score}%</p>
                                        </div>
                                        <button onClick={() => setSelectedProject(project)} className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-xl hover:bg-gray-800 transition-all active:scale-95 whitespace-nowrap">
                                            Review
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-4">
                    <h2 className="text-xl font-black text-gray-900 px-2 uppercase tracking-tight">Approved Project Modifications</h2>
                    {changeRequests.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <svg className="mx-auto h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="mt-4 text-gray-400 font-bold uppercase tracking-widest">No Change Requests</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {changeRequests.map((req) => (
                                <div key={req.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-between gap-6 group">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-purple-100 text-purple-700 border-purple-200">
                                                Change Request
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Submitted {new Date(req.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{req.project.title}</h3>
                                        <p className="text-[11px] text-gray-500 font-bold flex gap-2">
                                            <span className="text-gray-400 uppercase tracking-widest">Fields:</span> {req.fields.join(", ")}
                                        </p>
                                    </div>
                                    <button onClick={() => setSelectedRequest(req)} className="bg-purple-600 text-white px-8 py-3 rounded-2xl text-sm font-bold shadow-xl hover:bg-purple-700 transition-all active:scale-95 whitespace-nowrap">
                                        Evaluate
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedProject && (
                <ReviewModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onStatusUpdate={fetchData}
                />
            )}

            {selectedRequest && (
                <ChangeRequestReviewModal
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
}
