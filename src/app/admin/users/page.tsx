import { AdminService } from "@/services/admin.service";
import AdminUserTable from "@/components/AdminUserTable";

export default async function AdminUsersPage() {
    const initialUsers = await AdminService.getUsers();

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">User <span className="text-blue-600">Governance</span></h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Manage credentials, roles, and platform status</p>
            </div>

            <AdminUserTable initialUsers={initialUsers} />
        </div>
    );
}
