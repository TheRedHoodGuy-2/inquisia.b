import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { AdminService } from "@/services/admin.service";

export async function GET(request: Request) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") || undefined;
        const status = searchParams.get("status") || undefined;
        const department_id = searchParams.get("department_id") || undefined;

        const projects = await AdminService.getProjects(query, status, department_id);
        return NextResponse.json({ success: true, data: projects });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message.includes("Forbidden") ? 403 : 500 }
        );
    }
}
