"use client";

import { useState, useEffect, useCallback } from "react";
import ProjectCard from "@/components/ProjectCard";
import { useSearchParams, useRouter } from "next/navigation";

export default function SearchPortal() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [projects, setProjects] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
    const [suggestionLoading, setSuggestionLoading] = useState(false);

    const [filters, setFilters] = useState({
        query: searchParams.get("query") || "",
        department_id: searchParams.get("department_id") || "",
        ai_category: searchParams.get("ai_category") || "",
        page: parseInt(searchParams.get("page") || "1")
    });

    const fetchMetadata = async () => {
        const [dRes, cRes] = await Promise.all([
            fetch("/api/departments"),
            fetch("/api/ai-categories")
        ]);
        const dData = await dRes.json();
        const cData = await cRes.json();
        if (dData.success) setDepartments(dData.data);
        if (cData.success) setCategories(cData.data);
    };

    const fetchSuggestions = async (query: string) => {
        setSuggestionLoading(true);
        try {
            const res = await fetch("/api/ai/suggest-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query })
            });
            const data = await res.json();
            if (data.success) {
                setSuggestedCategories(data.suggestions);
            }
        } catch (error) {
            console.error("Fetch suggestions failed:", error);
        } finally {
            setSuggestionLoading(false);
        }
    };

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setSuggestedCategories([]); // Reset suggestions
        const params = new URLSearchParams();
        if (filters.query) params.set("query", filters.query);
        if (filters.department_id) params.set("department_id", filters.department_id);
        if (filters.ai_category) params.set("ai_category", filters.ai_category);
        params.set("page", filters.page.toString());

        try {
            const res = await fetch(`/api/projects/public?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setProjects(data.items);
                setTotal(data.total);

                // Trigger fallback if zero results and query exists
                if (data.items.length === 0 && filters.query) {
                    fetchSuggestions(filters.query);
                }
            }
        } catch (error) {
            console.error("Fetch projects failed:", error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchProjects();
        // Update URL
        const params = new URLSearchParams();
        if (filters.query) params.set("query", filters.query);
        if (filters.department_id) params.set("department_id", filters.department_id);
        if (filters.ai_category) params.set("ai_category", filters.ai_category);
        if (filters.page > 1) params.set("page", filters.page.toString());
        router.push(`/projects?${params.toString()}`, { scroll: false });
    }, [filters, fetchProjects, router]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="bg-gray-900 pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
                            Explore Research <span className="text-blue-500">Excellence</span>
                        </h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm max-w-2xl mx-auto">
                            Discover innovative undergraduate thesis projects from Babcock University's brightest minds.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex-1 relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by title, abstract, or keywords..."
                                    className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 text-white font-bold placeholder:text-gray-500 text-lg"
                                    value={filters.query}
                                    onChange={e => handleFilterChange("query", e.target.value)}
                                />
                            </div>
                            <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <aside className="w-full lg:w-72 space-y-8">
                        <div className="space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Filters</h2>
                                <button
                                    onClick={() => setFilters({ query: "", department_id: "", ai_category: "", page: 1 })}
                                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                >
                                    Clear All
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Department</label>
                                    <select
                                        value={filters.department_id}
                                        onChange={e => handleFilterChange("department_id", e.target.value)}
                                        className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-blue-500"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AI Category</label>
                                    <select
                                        value={filters.ai_category}
                                        onChange={e => handleFilterChange("ai_category", e.target.value)}
                                        className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm font-bold text-gray-900 focus:ring-blue-500"
                                    >
                                        <option value="">All Categories</option>
                                        {categories.map(c => (
                                            <option key={c.name} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-3xl text-white space-y-4 shadow-xl shadow-blue-500/10">
                            <h3 className="text-sm font-black uppercase tracking-widest">Contribute Research</h3>
                            <p className="text-xs font-bold text-blue-100 leading-relaxed">Are you a Babcock final year student? Upload your project to the repository today.</p>
                            <button onClick={() => router.push('/upload')} className="w-full bg-white text-blue-600 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-all">
                                Get Started
                            </button>
                        </div>
                    </aside>

                    {/* Results Area */}
                    <div className="flex-1 space-y-8">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {loading ? 'Searching...' : `Found ${total} Projects`}
                            </p>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="bg-gray-100 animate-pulse rounded-3xl h-64" />
                                ))}
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 px-4">
                                <div className="max-w-sm mx-auto space-y-6">
                                    <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
                                        <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">No Matches Found</h3>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">We couldn't find any projects matching "{filters.query}".</p>
                                    </div>

                                    {(suggestionLoading || suggestedCategories.length > 0) && (
                                        <div className="pt-8 border-t border-gray-50 space-y-4">
                                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Try exploring these categories instead:</p>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {suggestionLoading ? (
                                                    [1, 2, 3].map(i => (
                                                        <div key={i} className="h-8 w-24 bg-gray-100 animate-pulse rounded-full" />
                                                    ))
                                                ) : (
                                                    suggestedCategories.map(cat => (
                                                        <button
                                                            key={cat}
                                                            onClick={() => handleFilterChange("ai_category", cat)}
                                                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-600 hover:text-white transition-all transform hover:scale-105"
                                                        >
                                                            {cat}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {projects.map(p => (
                                    <ProjectCard key={p.id} project={p} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {total > 0 && (
                            <div className="flex items-center justify-center gap-2 pt-8">
                                <button
                                    disabled={filters.page === 1}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest px-4">Page {filters.page}</span>
                                <button
                                    disabled={projects.length < 12 || (filters.page * 12) >= total}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
