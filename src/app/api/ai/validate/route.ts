import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { AIService } from "@/services/ai.service";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculatePlagiarismScore } from "@/lib/plagiarism";

// ── CORS helper ──────────────────────────────────────────────────────────────
// Returns CORS headers as a plain Record<string, string> (always defined values).
function corsHeaders(origin: string | null): Record<string, string> {
    const allowed: string[] = [
        "http://localhost:5173",
        "http://localhost:3000",
        ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ];

    const isAllowed =
        !!origin &&
        (allowed.includes(origin) ||
            /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin));

    if (!isAllowed) return {};

    return {
        "Access-Control-Allow-Origin": origin!,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    };
}

// ── CORS preflight ───────────────────────────────────────────────────────────
export async function OPTIONS(request: Request) {
    const origin = request.headers.get("origin");
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// ── Timeout helper ───────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        promise,
        new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
    ]);
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
    const origin = request.headers.get("origin");

    try {
        await requireAuth();

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const abstract = formData.get("abstract") as string;
        const file = formData.get("file") as File | null;

        if (!title || !abstract) {
            return NextResponse.json(
                { success: false, error: "Title and abstract are required for validation" },
                { status: 400, headers: corsHeaders(origin) }
            );
        }

        if (abstract.length < 50) {
            return NextResponse.json(
                { success: false, error: "Abstract must be at least 50 characters for AI analysis" },
                { status: 400, headers: corsHeaders(origin) }
            );
        }

        // Prioritize pre-extracted PDF text from the client if provided
        let pdfText = formData.get("pdfText") as string || "";
        let pdfParseError: string | undefined;

        // Only try server-side parsing if the client-side extraction failed or wasn't provided
        if (!pdfText && file) {
            try {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const pdfParse = require("pdf-parse");
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // Resolve parser — handles both pdf-parse v1 (function) and v2 (class-based)
                const parserClass = typeof pdfParse === "function"
                    ? pdfParse
                    : (pdfParse.PDFParse || pdfParse.default || pdfParse);

                if (
                    typeof parserClass === "function" &&
                    (parserClass.toString().includes("class") || parserClass.name === "PDFParse")
                ) {
                    // Class-based API (pdf-parse v2)
                    const instance = new parserClass({ data: buffer });
                    const result = await instance.getText();
                    pdfText = result.text ?? "";
                } else if (typeof parserClass === "function") {
                    // Function-based API (pdf-parse v1 / standard)
                    const pdfData = await parserClass(buffer);
                    pdfText = pdfData.text ?? "";
                } else {
                    throw new Error(`PDF parser type unresolved: ${typeof parserClass}`);
                }
            } catch (err: any) {
                // Log clearly — this is NOT a silent failure so we can debug in Vercel logs
                console.error("[VALIDATE] PDF parse failed:", err?.message ?? err);
                pdfParseError = err?.message ?? "PDF could not be read";
            }
        }

        const { data: categoriesData } = await supabaseAdmin.from("ai_categories").select("name");
        const availableCategories = categoriesData?.map(c => c.name) || [];

        // Run AI + plagiarism with timeouts so we always return JSON before Vercel cuts us off
        const aiResult = await withTimeout(
            AIService.generateProjectMetadata({ title, abstract, pdfText }, availableCategories),
            50000 // 50s — Vercel Hobby gives 60s total
        );

        const plagiarismResult = pdfText
            ? await withTimeout(calculatePlagiarismScore(pdfText), 8000)
            : null;

        const aiMetadata = aiResult ?? {
            valid: true,
            category: availableCategories[0] ?? "General",
            tags: ["Research", "Academic"],
            message: "Elara is taking longer than usual. You can proceed — a supervisor will review your submission.",
            suggested_prompt: null,
        };

        return NextResponse.json(
            {
                success: true,
                data: {
                    valid: aiMetadata.valid,
                    category: aiMetadata.category,
                    tags: aiMetadata.tags,
                    message: aiMetadata.message || "AI analysis complete.",
                    suggested_prompt: aiMetadata.suggested_prompt,
                    pdfText: pdfText || undefined,
                    pdfParseError: pdfParseError || undefined,
                    plagiarismData: plagiarismResult || undefined,
                },
            },
            { headers: corsHeaders(origin) }
        );
    } catch (error: any) {
        console.error("AI Validation API Error:", error);

        if (error.message === "Unauthorized") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401, headers: corsHeaders(origin) }
            );
        }

        return NextResponse.json(
            { success: false, error: "Elara is having trouble right now. You can still proceed with submission." },
            { status: 500, headers: corsHeaders(origin) }
        );
    }
}
