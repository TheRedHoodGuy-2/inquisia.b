import { AdminService } from "@/services/admin.service";
import SupervisorQueueTable from "@/components/SupervisorQueueTable";

export default async function AdminSupervisorsPage() {
    const supervisors = await AdminService.getUsers(undefined, "supervisor");
    const pendingSupervisors = supervisors.filter(s => !s.is_verified);

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Staff <span className="text-blue-600">Verification</span></h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Approve credentials for supervisors to begin reviewing research</p>
            </div>

            <SupervisorQueueTable initialSupervisors={pendingSupervisors} />
        </div>
    );
}
