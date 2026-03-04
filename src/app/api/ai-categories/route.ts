import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function GET() {
    try {
        console.log("Fetching AI categories...");
        const { data, error } = await supabaseAdmin
            .from("projects")
            .select("ai_category")
            .eq("status", "approved")
            .not("ai_category", "is", null);

        if (error) {
            console.error("Supabase error in ai-categories:", error);
            throw error;
        }

        const categories = Array.from(new Set((data || []).map(p => p.ai_category)))
            .map(name => ({ name }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

        console.log(`Found ${categories.length} categories`);
        return NextResponse.json({ success: true, data: categories });
    } catch (error: any) {
        console.error("AI categories API error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
