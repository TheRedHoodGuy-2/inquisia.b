"use client";

import { useState } from "react";
import Link from "next/link";

interface AdminProjectTableProps {
    initialProjects: any[];
}

export default function AdminProjectTable({ initialProjects }: AdminProjectTableProps) {
    const [projects, setProjects] = useState(initialProjects);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Status Mod Modal State
    const [modProject, setModProject] = useState<any | null>(null);
    const [modStatus, setModStatus] = useState<string>("pending");
    const [modReason, setModReason] = useState("");

    // Delete Modal State
    const [deleteProject, setDeleteProject] = useState<any | null>(null);

    const fetchProjects = async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set("query", search);
        if (statusFilter) params.set("status", statusFilter);

        try {
            const res = await fetch(`/api/admin/projects?${params.toString()}`);
            const data = await res.json();
            if (data.success) setProjects(data.data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!modProject || !modReason) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/projects/${modProject.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: modStatus, reason: modReason })
            });
            const data = await res.json();
            if (data.success) {
                setModProject(null);
                setModReason("");
                fetchProjects();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Update status failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!deleteProject) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/projects/${deleteProject.id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            if (data.success) {
                setDeleteProject(null);
                fetchProjects();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-50 text-green-600 border-green-100';
            case 'pending': return 'bg-yellow-50 text-yellow-600 border-yellow-100';
            case 'changes_requested': return 'bg-orange-50 text-orange-600 border-orange-100';
            case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <input
                        type="text"
                        placeholder="Search by title or abstract..."
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchProjects()}
                    />
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex gap-2">
                    <select
                        className="bg-white border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest px-4 shadow-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="changes_requested">Changes Requested</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button
                        onClick={fetchProjects}
                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                        Filter
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Project Title</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Supervisor</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dept</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {projects.map((project) => (
                            <tr key={project.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-5 max-w-xs">
                                    <div className="flex flex-col">
                                        <Link href={`/projects/${project.id}`} className="font-black text-gray-900 text-sm line-clamp-1 hover:text-blue-600 transition-colors">
                                            {project.title}
                                        </Link>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight line-clamp-1 mt-1">
                                            By {project.project_authors?.[0]?.student?.full_name || "Unknown"}
                                            {project.project_authors?.length > 1 ? ` +${project.project_authors.length - 1}` : ""}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        {project.supervisor?.full_name || project.supervisor?.display_name || "N/A"}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{project.department?.name || "N/A"}</span>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(project.status)}`}>
                                        {project.status.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right space-x-4">
                                    <button
                                        onClick={() => {
                                            setModProject(project);
                                            setModStatus(project.status);
                                        }}
                                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                    >
                                        Status
                                    </button>
                                    <button
                                        onClick={() => setDeleteProject(project)}
                                        className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {projects.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-8 py-10 text-center text-sm font-bold text-gray-400">
                                    No projects found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Moderation Modal */}
            {modProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Force <span className="text-blue-600">Status</span></h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Override project state globally</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Project Status</label>
                                <select
                                    className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-blue-500 p-3"
                                    value={modStatus}
                                    onChange={(e) => setModStatus(e.target.value)}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="changes_requested">Changes Requested</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mandatory Reason</label>
                                <textarea
                                    placeholder="Briefly state the reason for this administrative override..."
                                    className="w-full h-32 bg-gray-50 border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:ring-blue-500 resize-none p-4"
                                    value={modReason}
                                    onChange={(e) => setModReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setModProject(null)}
                                className="flex-1 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={loading || !modReason}
                                className="flex-1 bg-gray-900 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black active:scale-95 transition-all shadow-xl disabled:opacity-30"
                            >
                                {loading ? "Updating..." : "Force Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Warning Modal */}
            {deleteProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl items-center flex flex-col text-center space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center rotate-12 mb-2">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Hard Delete?</h2>
                            <p className="text-xs font-bold text-gray-500 mt-2 px-4 leading-relaxed bg-gray-50 p-4 rounded-xl mt-4">
                                This will permanently destroy <span className="font-black text-gray-900">{deleteProject.title}</span>, stripping all files, version history, and comments from the database.
                            </p>
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-4">This action cannot be undone.</p>
                        </div>

                        <div className="flex gap-2 w-full mt-4">
                            <button
                                onClick={() => setDeleteProject(null)}
                                className="flex-1 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteProject}
                                disabled={loading}
                                className="flex-1 bg-red-600 text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-xl disabled:opacity-30"
                            >
                                {loading ? "Erasing..." : "Destroy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
