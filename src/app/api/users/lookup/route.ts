import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET /api/users/lookup?matric_no=XX/XXXX/XX
// Looks up a student by their matriculation number.
// Only authenticated users can search.
export async function GET(request: Request) {
    try {
        await requireAuth();

        const { searchParams } = new URL(request.url);
        const matric_no = searchParams.get("matric_no")?.trim();

        if (!matric_no) {
            return NextResponse.json(
                { success: false, error: "matric_no query parameter is required" },
                { status: 400 }
            );
        }

        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("id, full_name, display_name, matric_no, department_id")
            .eq("role", "student")
            .eq("matric_no", matric_no)
            .single();

        if (error || !user) {
            return NextResponse.json(
                { success: false, error: "No student found with that matriculation number." },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
