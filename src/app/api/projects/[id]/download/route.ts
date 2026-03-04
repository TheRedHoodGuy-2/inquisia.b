import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/projects/:id/download
 *
 * Increments download_count and returns the PDF URL.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        console.log("[Download] Fetching project:", projectId);

        // 1. Fetch the project record
        const { data: project, error: fetchError } = await supabaseAdmin
            .from("projects")
            .select("id, report_url, downloads, status")
            .eq("id", projectId)
            .single();

        if (fetchError) {
            console.error("[Download] Fetch error:", fetchError);
            return NextResponse.json(
                { success: false, error: `DB error: ${fetchError.message}` },
                { status: 404 }
            );
        }

        if (!project) {
            return NextResponse.json(
                { success: false, error: "Project not found." },
                { status: 404 }
            );
        }

        console.log("[Download] Project found:", { id: project.id, has_url: !!project.report_url, status: project.status });

        if (!project.report_url) {
            return NextResponse.json(
                { success: false, error: "This project has no downloadable PDF." },
                { status: 400 }
            );
        }

        // 2. Increment download count — fire and forget, don't fail the download
        supabaseAdmin
            .from("projects")
            .update({ downloads: (project.downloads || 0) + 1 })
            .eq("id", projectId)
            .then(({ error }) => {
                if (error) console.warn("[Download] Increment error (non-fatal):", error.message);
            });

        return NextResponse.json({
            success: true,
            data: { url: project.report_url }
        });

    } catch (error) {
        console.error("[Download] Unexpected error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process download link" },
            { status: 500 }
        );
    }
}
