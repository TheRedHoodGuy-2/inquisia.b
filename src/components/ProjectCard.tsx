"use client";

import Link from "next/link";

interface ProjectCardProps {
    project: any;
}

export default function ProjectCard({ project }: ProjectCardProps) {
    const leadAuthor = project.authors?.find((a: any) => a.role_description === "Team Lead")?.student?.full_name || "Unknown Author";

    return (
        <Link href={`/projects/${project.id}`} className="group">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full bg-gradient-to-br from-white to-gray-50/30">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                            {project.department?.name || 'Research'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                            {project.year}
                        </span>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight uppercase tracking-tight">
                        {project.title}
                    </h3>

                    <p className="text-sm text-gray-500 font-medium line-clamp-3 leading-relaxed">
                        {project.abstract}
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">
                            {leadAuthor.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lead Author</span>
                            <span className="text-xs font-bold text-gray-900">{leadAuthor}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">View Details</span>
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
}
