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

        // 2. No summary? Check if we have the prerequisite PDF text
        if (!project.pdf_text) {
            return NextResponse.json(
                { success: false, error: "Summary cannot be generated for this project (PDF text missing)." },
                { status: 400 }
            );
        }

        // 3. Quota check
        await AIService.checkAndIncrementUsage(user.id, 'summary');

        // 4. Generate via Gemini
        const summary = await AIService.generateSummary({
            title: project.title,
            abstract: project.abstract,
            pdf_text: project.pdf_text
        });

        // 4. Return result (transient)
        return NextResponse.json({ success: true, summary });
    } catch (error: any) {
        console.error("AI Summary Route Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
