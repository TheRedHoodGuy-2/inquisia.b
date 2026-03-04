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
        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json({ success: false, error: "Elara needs a message to discuss this project with you." }, { status: 400 });
        }

        // 1. Fetch project context
        const project = await ProjectService.getPublicProjectDetail(id);

        if (!project.pdf_text) {
            return NextResponse.json(
                { success: false, error: "Elara cannot discuss this project because the PDF text is missing." },
                { status: 400 }
            );
        }

        // 2. Quota check
        await AIService.checkAndIncrementUsage(user.id, 'chat');

        // 3. Chat via Gemini using the RAG Engine
        const reply = await AIService.projectChat(
            id,
            {
                title: project.title,
                abstract: project.abstract,
                pdf_text: project.pdf_text
            },
            history || [],
            message
        );

        return NextResponse.json({ success: true, reply });
    } catch (error: any) {
        console.error("AI Project Chat Route Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
