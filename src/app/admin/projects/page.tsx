import { AdminService } from "@/services/admin.service";
import AdminProjectTable from "@/components/AdminProjectTable";

export default async function AdminProjectsPage() {
    // Fetch initial projects using Server Component
    const initialProjects = await AdminService.getProjects();

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Project <span className="text-blue-600">Oversight</span></h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Global moderation and management of all submissions</p>
            </div>

            <AdminProjectTable initialProjects={initialProjects} />
        </div>
    );
}
