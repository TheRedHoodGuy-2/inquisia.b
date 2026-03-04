import { NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json({ success: false, error: "Elara requires a query to suggest relevant categories." }, { status: 400 });
        }

        // 1. Fetch available categories from DB (using admin client)
        const { data: categories } = await supabaseAdmin
            .from('ai_categories')
            .select('name');

        const categoryNames = categories?.map((c: any) => c.name) || [];

        // 2. Get suggestions via Gemini
        const suggestions = await AIService.suggestCategories(query, categoryNames);

        return NextResponse.json({ success: true, suggestions });
    } catch (error: any) {
        console.error("Suggest Categories Route Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
