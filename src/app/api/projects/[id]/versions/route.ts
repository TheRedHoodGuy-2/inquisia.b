import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { ProjectService } from "@/services/project.service";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;

        const versions = await ProjectService.getProjectVersionHistory(id);

        return NextResponse.json({ success: true, data: versions });
    } catch (error: any) {
        console.error("Fetch versions error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Failed to fetch version history" },
            { status: 500 }
        );
    }
}
