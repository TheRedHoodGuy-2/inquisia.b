import { requireAdmin } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Security Guard
    const user = await requireAdmin().catch(() => null);
    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold tracking-tighter uppercase">Admin Panel</h2>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">Inquisia Governance</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4">
                    <Link href="/admin" className="block px-4 py-3 rounded-xl hover:bg-white/10 font-bold text-xs uppercase tracking-widest transition-all">
                        Dashboard
                    </Link>
                    <Link href="/admin/users" className="block px-4 py-3 rounded-xl hover:bg-white/10 font-bold text-xs uppercase tracking-widest transition-all">
                        User Management
                    </Link>
                    <Link href="/admin/projects" className="block px-4 py-3 rounded-xl hover:bg-white/10 font-bold text-xs uppercase tracking-widest transition-all text-blue-400">
                        Project Oversight
                    </Link>
                    <Link href="/admin/supervisors" className="block px-4 py-3 rounded-xl hover:bg-white/10 font-bold text-xs uppercase tracking-widest transition-all">
                        Supervisor Queue
                    </Link>
                    <Link href="/admin/departments" className="block px-4 py-3 rounded-xl hover:bg-white/10 font-bold text-xs uppercase tracking-widest transition-all">
                        Departments
                    </Link>
                    <Link href="/admin/ai-categories" className="block px-4 py-3 rounded-xl hover:bg-white/10 font-bold text-xs uppercase tracking-widest transition-all">
                        AI Categories
                    </Link>
                </nav>

                <div className="p-6 border-t border-white/10">
                    <Link href="/dashboard" className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        User Dashboard
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b h-16 flex items-center justify-between px-8 md:hidden">
                    <Link href="/admin" className="text-xl font-bold text-gray-900 tracking-tighter">ADMIN</Link>
                    {/* Mobile nav could go here */}
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}
