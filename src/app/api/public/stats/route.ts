import { NextResponse } from "next/server";
import { ProjectService } from "@/services/project.service";

export async function GET() {
    try {
        console.log("Fetching global stats...");
        const stats = await ProjectService.getGlobalStats();
        return NextResponse.json({ success: true, data: stats });
    } catch (error: any) {
        console.error("Stats API Route Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
