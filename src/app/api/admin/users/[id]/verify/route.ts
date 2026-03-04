import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { AdminService } from "@/services/admin.service";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id } = await params;

        await AdminService.verifySupervisor(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message.includes("Forbidden") ? 403 : 500 }
        );
    }
}
