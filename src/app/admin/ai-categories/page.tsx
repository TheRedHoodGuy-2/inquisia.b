import { supabaseAdmin } from "@/lib/supabase-admin";
import LookupManagement from "@/components/LookupManagement";

export default async function AdminAICategoriesPage() {
    const { data: categories } = await supabaseAdmin.from("ai_categories").select("*").order("name");

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Taxonomy <span className="text-blue-600">Management</span></h1>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">Curate AI classification technical tags for research discovery</p>
            </div>

            <LookupManagement
                title="AI Category"
                initialData={categories || []}
                apiPath="/api/admin/ai-categories"
            />
        </div>
    );
}
