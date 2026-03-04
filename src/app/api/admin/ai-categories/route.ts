import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { AdminService } from "@/services/admin.service";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
    try {
        await requireAdmin();
        const { data, error } = await supabaseAdmin.from("ai_categories").select("*").order("name");
        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await requireAdmin();
        const data = await request.json();
        await AdminService.manageLookupData("ai_categories", "create", undefined, data);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
