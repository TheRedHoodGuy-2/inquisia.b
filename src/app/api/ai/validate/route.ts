import { NextResponse } from "next/server";
const pdfParse = require("pdf-parse");
import { requireAuth } from "@/lib/session";
import { AIService } from "@/services/ai.service";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { calculatePlagiarismScore } from "@/lib/plagiarism";

export async function POST(request: Request) {
    try {
        // Only authenticated users can use the AI validation endpoint
        await requireAuth();

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const abstract = formData.get("abstract") as string;
        const file = formData.get("file") as File | null;

        if (!title || !abstract) {
            return NextResponse.json({ success: false, error: "Title and abstract are required for validation" }, { status: 400 });
        }

        if (abstract.length < 50) {
            return NextResponse.json({ success: false, error: "Abstract must be at least 50 characters for AI analysis" }, { status: 400 });
        }

        // 1. Conditionally parse the PDF if provided
        let pdfText = "";
        if (file) {
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

        // Run the AI metadata generation logic
        const aiMetadata = await AIService.generateProjectMetadata(
            { title, abstract, pdfText },
            availableCategories
        );

        // Pre-calculate Plagiarism / Similarity matching so the UI can warn the user
        let plagiarismData = null;
        if (pdfText) {
            plagiarismData = await calculatePlagiarismScore(pdfText);
        }

        return NextResponse.json({
            success: true,
            data: {
                valid: aiMetadata.valid,
                category: aiMetadata.category,
                tags: aiMetadata.tags,
                message: aiMetadata.message || "AI analysis complete. These are our suggested classifications.",
                suggested_prompt: aiMetadata.suggested_prompt,
                pdfText: pdfText || undefined,
                plagiarismData: plagiarismData || undefined
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
