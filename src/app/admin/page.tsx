import { AdminService } from "@/services/admin.service";
import Link from "next/link";

export default async function AdminDashboard() {
    const [metrics, activity] = await Promise.all([
        AdminService.getPlatformMetrics(),
        AdminService.getRecentActivity()
    ]);

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Platform <span className="text-blue-600">Overview</span></h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Real-time system health and throughput metrics</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">{metrics.totalUsers}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered Users</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                    <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">{metrics.totalProjects}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Official Projects</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                    <div className="w-12 h-12 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">{metrics.pendingSupervisors}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Supervisor Requests</p>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-gray-900 tracking-tighter">{metrics.pendingProjects}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Submissions Pending</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-4">Recent Platform Activity</h3>
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="divide-y divide-gray-50">
                            {activity.map((item, idx) => (
                                <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'user' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {item.type === 'user' ? (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 line-clamp-1">{item.title}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.subtitle}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Priority Actions */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-4">Priority Actions</h3>
                    <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white space-y-4 shadow-xl">
                        <Link href="/admin/supervisors" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">Supervisor Queue</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Verify credentials</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                        <Link href="/admin/users" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">User Moderation</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Status management</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>
                        <Link href="/admin/departments" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">System Config</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Taxonomy curation</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </Link>

                        {/* Data Archiving */}
                        <a href="/api/admin/export?type=projects" className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group mt-6 border-green-500/20">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest group-hover:text-green-400 transition-colors">Export Project Data (CSV)</p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Download entire platform archive</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-600 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
