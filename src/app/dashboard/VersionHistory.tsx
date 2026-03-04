"use client";

import { useState, useEffect } from "react";

export default function VersionHistory({ projectId }: { projectId: string }) {
    const [versions, setVersions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen && versions.length === 0) {
            fetchVersions();
        }
    }, [isOpen]);

    const fetchVersions = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}/versions`);
            const data = await res.json();
            if (data.success) setVersions(data.data);
        } catch (error) {
            console.error("Failed to fetch versions:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 border-t border-gray-100 pt-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-blue-600 transition-colors"
            >
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Version History
            </button>

            {isOpen && (
                <div className="mt-4 space-y-4 ml-2">
                    {loading ? (
                        <div className="animate-pulse flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                            <div className="h-2 w-32 bg-gray-100 rounded"></div>
                        </div>
                    ) : versions.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No previous versions available.</p>
                    ) : (
                        <div className="relative border-l-2 border-gray-100 pl-4 space-y-6">
                            {versions.map((v, idx) => (
                                <div key={v.id} className="relative">
                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-blue-500"></div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-900">Version {v.version_number}</span>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {new Date(v.uploaded_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-[11px] text-gray-500 leading-relaxed">
                                            <p><span className="font-semibold">Plagiarism:</span> {v.plagiarism_score}%</p>
                                            {v.supervisor_feedback && (
                                                <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-100 text-gray-600 italic">
                                                    "{v.supervisor_feedback}"
                                                </div>
                                            )}
                                        </div>
                                        <a
                                            href={v.report_url}
                                            target="_blank"
                                            className="inline-block mt-1 text-[10px] font-bold text-blue-600 hover:underline"
                                        >
                                            Download this version
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
