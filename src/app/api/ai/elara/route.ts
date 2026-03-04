import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { AIService } from "@/services/ai.service";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Builds a structured, text-based knowledge base from the entire
 * repository of approved projects. Injected into Elara's context window.
 */
async function buildKnowledgeBase(): Promise<string> {
    // Step 1: Fetch all approved projects with basic fields
    const { data: projects, error } = await supabaseAdmin
        .from("projects")
        .select(`
            id,
            title,
            abstract,
            ai_category,
            student_tags,
            year,
            departments(name)
        `)
        .eq("status", "approved")
        .order("year", { ascending: false })
        .limit(300);

    if (error) {
        console.error("Elara knowledge base fetch error:", error);
        return "Unable to load repository data at this time.";
    }

    if (!projects || projects.length === 0) {
        return "No approved projects are currently in the repository.";
    }

    // Step 2: Fetch authors separately (avoids complex join syntax issues)
    const projectIds = projects.map((p: any) => p.id);
    const { data: authorsData } = await supabaseAdmin
        .from("project_authors")
        .select("project_id, student_id, role_description, users(full_name)")
        .in("project_id", projectIds);

    // Build a quick lookup: project_id -> author names
    const authorMap: Record<string, string[]> = {};
    for (const a of (authorsData ?? [])) {
        const name = (a.users as any)?.full_name;
        if (name) {
            if (!authorMap[a.project_id]) authorMap[a.project_id] = [];
            authorMap[a.project_id].push(name);
        }
    }

    // Step 3: Format as structured text
    const lines = projects.map((p: any, i: number) => {
        const authors = (authorMap[p.id] ?? []).join(", ") || "Unknown";
        const tags = Array.isArray(p.student_tags) && p.student_tags.length > 0
            ? p.student_tags.join(", ")
            : "N/A";
        const dept = (p.departments as any)?.name ?? "Unknown Department";
        const abstract = (p.abstract ?? "").substring(0, 350);
        const truncated = p.abstract?.length > 350 ? "..." : "";

        return [
            `[${i + 1}] "${p.title}"`,
            `   Category: ${p.ai_category ?? "Uncategorized"} | Year: ${p.year} | Department: ${dept}`,
            `   Authors: ${authors}`,
            `   Tags: ${tags}`,
            `   Abstract: ${abstract}${truncated}`,
            `   URL: /projects/${p.id}`,
        ].join("\n");
    });

    return `Total approved projects in repository: ${projects.length}\n\n${lines.join("\n\n")}`;
}

export async function POST(request: Request) {
    try {
        const user = await requireAuth();
        const { message, history } = await request.json();

        if (!message?.trim()) {
            return NextResponse.json({ success: false, error: "Elara needs a message from you to provide a repository-wide answer." }, { status: 400 });
        }

        // Rate limiting
        await AIService.checkAndIncrementUsage(user.id, "elara");

        // Build the knowledge base
        const knowledgeBase = await buildKnowledgeBase();

        const reply = await AIService.elaraChat(knowledgeBase, history || [], message);

        return NextResponse.json({ success: true, reply });
    } catch (error: any) {
        console.error("Elara Route Error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message === "Unauthorized" ? 401 : 500 }
        );
    }
}
