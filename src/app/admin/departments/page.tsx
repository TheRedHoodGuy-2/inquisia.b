import { supabaseAdmin } from "@/lib/supabase-admin";
import LookupManagement from "@/components/LookupManagement";

export default async function AdminDepartmentsPage() {
    const { data: departments } = await supabaseAdmin.from("departments").select("*").order("name");

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Academic <span className="text-blue-600">Structure</span></h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Manage university departments and institutional grouping</p>
            </div>

            <LookupManagement
                title="Department"
                initialData={departments || []}
                apiPath="/api/admin/departments"
            />
        </div>
    );
}
