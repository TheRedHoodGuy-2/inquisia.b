import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("department_id");

    try {
        console.log("Supervisor API called (Fetching all verified supervisors)");

        let query = supabase
            .from("users")
            .select("id, full_name, display_name, degrees, departments(name)")
            .eq("role", "supervisor")
            .eq("is_active", true)
            .eq("is_verified", true);

        const { data, error } = await query.order("full_name");

        if (error) {
            throw error;
        }

        console.log(`Found ${data?.length || 0} supervisors`);

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error: any) {
        console.error("Failed to fetch supervisors:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch supervisors" },
            { status: 500 }
        );
    }
}
