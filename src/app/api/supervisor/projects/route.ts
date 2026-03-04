import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { ProjectService } from "@/services/project.service";

export async function GET() {
    try {
        const user = await requireAuth();

        if (user.role !== "supervisor") {
            return NextResponse.json({ success: false, error: "Only supervisors can access this endpoint" }, { status: 403 });
        }

        const projects = await ProjectService.getSupervisorProjects(user.id);
        return NextResponse.json({ success: true, data: projects });

    } catch (error: any) {
        console.error("Supervisor projects fetch error:", error);
        if (error.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
    }
}
