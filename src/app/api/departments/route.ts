import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function GET() {
    try {
        console.log("Fetching departments...");
        const { data, error } = await supabaseAdmin
            .from("departments")
            .select("id, name")
            .order("name");

        if (error) {
            console.error("Supabase error in departments:", error);
            throw error;
        }

        console.log(`Found ${data?.length || 0} departments`);
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("Departments API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
