"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import ProjectCard from "@/components/ProjectCard";
import AIChatWidget from "@/components/AIChatWidget";
import CommentSection from "@/components/CommentSection";

interface ProjectDetailProps {
    params: Promise<{ id: string }>;
}

export default function ProjectDetail({ params }: ProjectDetailProps) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [relatedProjects, setRelatedProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    useEffect(() => {
        const fetchSession = async () => {
            try {
                const res = await fetch('/api/auth/session');
                const data = await res.json();
                if (data.success && data.user) {
                    setCurrentUser(data.user);
                }
            } catch (e) {
                // Ignore silent session errors
            }
        };
        fetchSession();
    }, []);

    const handleSummarize = async () => {
        if (!currentUser) {
            window.location.href = `/login?redirect=/projects/${id}`;
            return;
        }
        if (!project || project.ai_summary) return;
        setSummaryLoading(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/ai/summary`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setProject({ ...project, ai_summary: data.summary });
            } else {
                alert(data.error || "Summary could not be generated at this time. Please try again later.");
            }
        } catch (err) {
            alert("Summary could not be generated at this time. Please try again later.");
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!currentUser) {
            window.location.href = `/login?redirect=/projects/${id}`;
            return;
        }
        if (!project || project.ai_limitations) return;
        setAnalysisLoading(true);
        try {
            const res = await fetch(`/api/projects/${project.id}/ai/analysis`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setProject({ ...project, ai_limitations: JSON.stringify(data.analysis) });
            } else {
                alert(data.error || "Analysis could not be generated at this time. Please try again later.");
            }
        } catch (err) {
            alert("Analysis could not be generated at this time. Please try again later.");
        } finally {
            setAnalysisLoading(false);
        }
    };

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${id}/public`);
                const data = await res.json();
                if (data.success) {
                    setProject(data.data);
                    // Fetch related
                    const rRes = await fetch(`/api/projects/${id}/related?category=${encodeURIComponent(data.data.ai_category)}`);
                    const rData = await rRes.json();
                    if (rData.success) setRelatedProjects(rData.data);
                } else {
                    setError(data.error || "Project not found or not public.");
                }
            } catch (err) {
                setError("Failed to fetch project details.");
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initializing Exploration...</p>
            </div>
        </div>
    );

    if (error || !project) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
            <div className="space-y-4 max-w-sm">
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Project Unavailable</h1>
                <h3 className="mt-4 text-sm font-black text-gray-900 uppercase tracking-widest">{error || "The requested project could not be found."}</h3>
                <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {id}</p>
                <Link href="/projects" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl">Back to Gallery</Link>
            </div>
        </div>
    );

    const leadAuthor = project.authors?.find((a: any) => a.role_description === "Team Lead");
    const coAuthors = project.authors?.filter((a: any) => a.role_description === "Co-author");

    let parsedAnalysis = null;
    if (project.ai_limitations) {
        try {
            parsedAnalysis = JSON.parse(project.ai_limitations);
        } catch (e) {
            console.error("Failed to parse AI analysis");
        }
    }

    const renderProfileTooltip = (profile: any) => {
        if (!profile) return null;
        return (
            <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 cursor-default pointer-events-none group-hover:pointer-events-auto z-50">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-md">
                        {(profile.display_name || profile.full_name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-900 tracking-tight">{profile.display_name || profile.full_name}</p>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{profile.role || "Student"}</p>
                    </div>
                </div>
                {profile.bio && (
                    <p className="mt-3 text-xs text-gray-600 leading-relaxed line-clamp-3">
                        {profile.bio}
                    </p>
                )}
                {profile.links && Object.keys(profile.links).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        {Object.entries(profile.links).slice(0, 3).map(([key]) => (
                            <span key={key} className="px-2 py-1 rounded bg-gray-50 text-gray-500 text-[9px] font-black uppercase tracking-widest border border-gray-100">
                                {key}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header / Hero */}
            <div className="bg-gray-900 pt-32 pb-40 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-50" />
                <div className="max-w-5xl mx-auto relative space-y-10">
                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/projects" className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 hover:text-blue-400 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            Back to Gallery
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-gray-800" />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Published {new Date(project.updated_at).toLocaleDateString()}</span>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-2">
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/30 bg-blue-500/10 text-blue-400">
                                {project.department?.name}
                            </span>
                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-500/30 bg-purple-500/10 text-purple-400">
                                {project.ai_category}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] max-w-4xl">
                            {project.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 -mt-24 pb-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Abstract & Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100 space-y-10">
                            <section className="space-y-6">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-6 h-px bg-gray-200" />
                                        Abstract
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSummarize}
                                            disabled={summaryLoading}
                                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${project.ai_summary
                                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                                : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700'
                                                } disabled:opacity-50`}
                                        >
                                            {summaryLoading ? 'Generating...' : project.ai_summary ? 'View Summary' : 'Summarize'}
                                        </button>
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={analysisLoading}
                                            className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${project.ai_limitations
                                                ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                : 'bg-purple-600 text-white shadow-lg shadow-purple-500/20 hover:bg-purple-700'
                                                } disabled:opacity-50`}
                                        >
                                            {analysisLoading ? 'Analyzing...' : project.ai_limitations ? 'View Analysis' : 'Analyze Research'}
                                        </button>
                                    </div>
                                </div>
                                <p className="text-lg font-medium text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {project.abstract}
                                </p>

                                {project.ai_summary && (
                                    <div className="mt-8 p-8 rounded-3xl bg-blue-50/50 border border-blue-100/50 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" /></svg>
                                            </div>
                                            <h3 className="text-xs font-black text-blue-900 uppercase tracking-widest">AI Generated Summary</h3>
                                        </div>
                                        <p className="text-sm font-medium text-blue-900/80 leading-relaxed whitespace-pre-wrap">
                                            {project.ai_summary}
                                        </p>
                                    </div>
                                )}

                                {parsedAnalysis && (
                                    <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            </div>
                                            <h3 className="text-xs font-black text-purple-900 uppercase tracking-widest">Academic Analysis</h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100/50 space-y-2">
                                                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Limitations</p>
                                                <p className="text-sm font-medium text-purple-900/80 leading-relaxed">{parsedAnalysis.limitations}</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 space-y-2">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Improvements</p>
                                                <p className="text-sm font-medium text-indigo-900/80 leading-relaxed">{parsedAnalysis.improvements}</p>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100/50 space-y-2">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Future Directions</p>
                                                <p className="text-sm font-medium text-blue-900/80 leading-relaxed">{parsedAnalysis.future_directions}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            {/* Chat Section */}
                            <section className="space-y-6">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-6 h-px bg-gray-200" />
                                    Interactive Discussion
                                </h2>
                                <AIChatWidget
                                    endpoint={`/api/projects/${id}/ai/chat`}
                                    title="Project Assistant"
                                    placeholder="Ask a question about this research..."
                                    initialMessage={`I've read through "${project.title}". Feel free to ask me anything about its methodology, findings, or impact!`}
                                    mode="embedded"
                                />
                            </section>

                            <section className="space-y-6">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-6 h-px bg-gray-200" />
                                    Research Resources
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <a href={project.report_url} target="_blank" className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-blue-200 hover:bg-blue-50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-100 text-blue-600 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">The Thesis</p>
                                                <p className="text-sm font-black text-gray-900 uppercase">Download PDF</p>
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </a>

                                    {project.github_url && (
                                        <a href={project.github_url} target="_blank" className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100 group hover:border-gray-300 hover:bg-gray-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gray-200 text-gray-700 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Codebase</p>
                                                    <p className="text-sm font-black text-gray-900 uppercase">View on GitHub</p>
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Comments Section */}
                        {project.status === "approved" && (
                            <CommentSection projectId={project.id} currentUser={currentUser} />
                        )}
                    </div>

                    {/* Meta Sidebar */}
                    <aside className="space-y-6">
                        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 space-y-8">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Authors</h3>
                                <div className="space-y-6">
                                    {leadAuthor && leadAuthor.student && (
                                        <div className="group relative flex items-center gap-4">
                                            <a
                                                href={`/profile/${leadAuthor.student.id}`}
                                                className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold hover:ring-2 hover:ring-offset-2 hover:ring-blue-600 transition-all focus:outline-none"
                                            >
                                                {leadAuthor.student.full_name[0]}
                                            </a>
                                            <div>
                                                <a
                                                    href={`/profile/${leadAuthor.student.id}`}
                                                    className="text-sm font-black text-gray-900 uppercase hover:underline focus:outline-none text-left"
                                                >
                                                    {leadAuthor.student.full_name}
                                                </a>
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Team Lead</p>
                                            </div>
                                            {renderProfileTooltip(leadAuthor.student)}
                                        </div>
                                    )}
                                    {coAuthors?.map((a: any) => (
                                        <div key={a.student.id} className="group relative flex items-center gap-4">
                                            <a
                                                href={`/profile/${a.student.id}`}
                                                className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold hover:ring-2 hover:ring-offset-2 hover:ring-gray-300 transition-all focus:outline-none"
                                            >
                                                {a.student.full_name[0]}
                                            </a>
                                            <div>
                                                <a
                                                    href={`/profile/${a.student.id}`}
                                                    className="text-sm font-black text-gray-900 uppercase hover:underline focus:outline-none text-left"
                                                >
                                                    {a.student.full_name}
                                                </a>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Co-author</p>
                                            </div>
                                            {renderProfileTooltip(a.student)}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <hr className="border-gray-50" />

                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supervisor</h3>
                                {project.supervisor && (
                                    <div className="group relative flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                        <a
                                            href={`/profile/${project.supervisor.id}`}
                                            className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-bold uppercase hover:ring-2 hover:ring-offset-2 hover:ring-gray-900 transition-all focus:outline-none"
                                        >
                                            {project.supervisor.full_name[0]}
                                        </a>
                                        <div>
                                            <a
                                                href={`/profile/${project.supervisor.id}`}
                                                className="text-xs font-black text-gray-900 uppercase hover:underline focus:outline-none text-left"
                                            >
                                                {project.supervisor.full_name}
                                            </a>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Evaluated</p>
                                        </div>
                                        {renderProfileTooltip({ ...project.supervisor, role: 'supervisor' })}
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white space-y-4 shadow-2xl">
                            <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">System Analysis</h3>
                            <div className="flex items-end justify-between">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plagiarism Score</p>
                                <p className={`text-4xl font-black ${project.plagiarism_score > 30 ? 'text-red-500' : 'text-green-500'}`}>
                                    {project.plagiarism_score}%
                                </p>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-loose">
                                This project has been cross-referenced with internal repositories and academic databases.
                            </p>
                        </div>
                    </aside>
                </div>

                {/* Related Projects Section */}
                {relatedProjects.length > 0 && (
                    <section className="mt-20 pt-20 border-t border-gray-100 space-y-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                                Related <span className="text-blue-600">Exploration</span>
                            </h2>
                            <Link href="/projects" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors">
                                Explore All Projects
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedProjects.map(p => (
                                <ProjectCard key={p.id} project={p} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Tooltips now handled inline */}
        </div>
    );
}
