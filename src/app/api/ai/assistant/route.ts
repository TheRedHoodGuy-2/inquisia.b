import { NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";
import { requireAuth } from "@/lib/session";

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const { message, history, pageContext } = await request.json();

        if (!message) {
            return NextResponse.json({ success: false, error: "Elara requires a message to guide your research." }, { status: 400 });
        }

        // 1. Quota check
        await AIService.checkAndIncrementUsage(user.id, 'assistant');

        const reply = await AIService.globalAssistant(
            pageContext || { path: "/" },
            history || [],
            message
        );

        return NextResponse.json({ success: true, reply });
    } catch (error: any) {
        console.error("Global AI Assistant Route Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
