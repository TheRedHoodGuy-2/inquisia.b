import { NextResponse } from "next/server";
import { ProjectService } from "@/services/project.service";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");

        if (!category) {
            return NextResponse.json({ success: true, data: [] });
        }

        const related = await ProjectService.getRelatedProjects(id, category);
        return NextResponse.json({ success: true, data: related });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
