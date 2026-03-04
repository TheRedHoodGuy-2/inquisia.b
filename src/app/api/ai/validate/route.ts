import { NextResponse } from "next/server";
const pdfParse = require("pdf-parse");
import { requireAuth } from "@/lib/session";
import { AIService } from "@/services/ai.service";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculatePlagiarismScore } from "@/lib/plagiarism";

// ── Timeout helper ──────────────────────────────────────────────────────────
// Races any promise against a timeout so Netlify never hard-kills the function
// and returns a raw "Internal Server Error" plain-text response.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        promise,
        new Promise<null>(resolve => setTimeout(() => resolve(null), ms))
    ]);
}

export async function POST(request: Request) {
    try {
        // Only authenticated users can use the AI validation endpoint
        await requireAuth();

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const abstract = formData.get("abstract") as string;
        const file = formData.get("file") as File | null;
        let pdfText = formData.get("pdfText") as string || ""; // Read pre-extracted text first

        if (!title || !abstract) {
            return NextResponse.json({ success: false, error: "Title and abstract are required for validation" }, { status: 400 });
        }

        if (abstract.length < 50) {
            return NextResponse.json({ success: false, error: "Abstract must be at least 50 characters for AI analysis" }, { status: 400 });
        }

        // 1. Conditionally parse the PDF if provided AND text wasn't already passed
        if (file && !pdfText) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const { PDFParse } = pdfParse as any;
                if (PDFParse) {
                    const parser = new PDFParse({ data: buffer });
                    const result = await parser.getText();
                    pdfText = result.text;
                } else {
                    const parse = typeof pdfParse === "function" ? pdfParse : (pdfParse as any).default;
                    const data = await parse(buffer);
                    pdfText = data.text;
                }
            } catch (err) {
                console.warn("Failed to parse PDF during validation:", err);
            }
        }

        // Fetch available categories from the database to guide the AI
        const { data: categoriesData } = await supabaseAdmin.from("ai_categories").select("name");
        const availableCategories = categoriesData?.map(c => c.name) || [];

        // 2. Run AI + plagiarism with an 8-second timeout.
        // If gemma takes too long, we return a safe default so the user can still upload.
        // Netlify hard-kills functions at 10s and returns plain text — this prevents that.
        const aiResult = await withTimeout(
            AIService.generateProjectMetadata({ title, abstract, pdfText }, availableCategories),
            8000
        );

        const plagiarismResult = pdfText
            ? await withTimeout(calculatePlagiarismScore(pdfText), 4000)
            : null;

        // If AI timed out, return a permissive default so the upload can still proceed
        const aiMetadata = aiResult ?? {
            valid: true,
            category: availableCategories[0] ?? "General",
            tags: ["Research", "Academic"],
            message: "Elara is taking longer than usual. You can still proceed — a supervisor will review your submission.",
            suggested_prompt: null,
        };

        return NextResponse.json({
            success: true,
            data: {
                valid: aiMetadata.valid,
                category: aiMetadata.category,
                tags: aiMetadata.tags,
                message: aiMetadata.message || "AI analysis complete. These are our suggested classifications.",
                suggested_prompt: aiMetadata.suggested_prompt,
                pdfText: pdfText || undefined,
                plagiarismData: plagiarismResult || undefined
            }
        });
    } catch (error: any) {
        console.error("AI Validation API Error:", error);

        if (error.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({
            success: false,
            error: "Elara is sleeping or having trouble analyzing your project right now. You can still proceed with submission."
        }, { status: 500 });
    }
}
