import { NextResponse } from "next/server";
import { ProjectService } from "@/services/project.service";
import { AIService } from "@/services/ai.service";
import { requireAuth } from "@/lib/session";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requireAuth();

        // 1. Fetch project details
        const project = await ProjectService.getPublicProjectDetail(id);

        // 2. Prerequisite check
        if (!project.pdf_text) {
            return NextResponse.json(
                { success: false, error: "Analysis cannot be performed for this project (PDF text missing)." },
                { status: 400 }
            );
        }

        // 3. Quota check
        await AIService.checkAndIncrementUsage(user.id, 'analysis');

        // 4. Generate via Gemini
        const analysis = await AIService.generateAnalysis({
            title: project.title,
            abstract: project.abstract,
            pdf_text: project.pdf_text
        });

        // 4. Return result (transient)
        return NextResponse.json({ success: true, analysis });
    } catch (error: any) {
        console.error("AI Analysis Route Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
