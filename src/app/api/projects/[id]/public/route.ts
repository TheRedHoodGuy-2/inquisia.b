import { NextResponse } from "next/server";
import { ProjectService } from "@/services/project.service";
import { getSession } from "@/lib/session";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const project = await ProjectService.getPublicProjectDetail(id);
        const session = await getSession();
        const user = session?.user;

        // Visibility Logic
        if (project.status !== 'approved') {
            if (!user) {
                return NextResponse.json({ success: false, error: "Authentication required to view this project." }, { status: 401 });
            }

            const isAdmin = user.role === 'admin';
            const isSupervisor = project.supervisor_id === user.id;
            const isAuthor = project.authors?.some((a: any) => a.student?.id === user.id);

            if (!isAdmin && !isSupervisor && !isAuthor) {
                return NextResponse.json({ success: false, error: "You do not have permission to view this project yet." }, { status: 403 });
            }
        }

        return NextResponse.json({ success: true, data: project });
    } catch (error: any) {
        console.error("Public Project Detail API Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            debug: process.env.NODE_ENV === 'development' ? error : undefined
        }, { status: 404 });
    }
}
