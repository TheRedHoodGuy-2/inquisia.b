import { NextResponse } from "next/server";
import { ProjectService } from "@/services/project.service";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const department_id = searchParams.get("department_id") || undefined;
        const ai_category = searchParams.get("ai_category") || undefined;
        const query = searchParams.get("query") || undefined;
        const year = searchParams.get("year") || undefined;
        const sort = searchParams.get("sort") || undefined;
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "12");

        const result = await ProjectService.getPublicProjects({
            department_id,
            ai_category,
            query,
            year,
            sort,
            page,
            limit
        });

        return NextResponse.json({ success: true, ...result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
