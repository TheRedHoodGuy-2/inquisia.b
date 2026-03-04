import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { ProjectService } from "@/services/project.service";
import { StorageService } from "@/services/storage.service";
import { calculatePlagiarismScore } from "@/lib/plagiarism";

// Dynamic import for pdf-parse to avoid bundling issues
const pdfParse = require("pdf-parse");

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        const formData = await request.formData();
        const metadata = JSON.parse(formData.get("metadata") as string);
        const file = formData.get("file") as File | null;

        let reportUrl;
        let pdfText;
        let plagiarismData;

        if (file) {
            // PDF Text Extraction
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const { PDFParse } = pdfParse as any;
            if (PDFParse) {
                const parser = new PDFParse({ data: buffer });
                const result = await parser.getText();
                pdfText = result.text;
            } else {
                const parse = typeof pdfParse === "function" ? pdfParse : (pdfParse as any).default;
                const pdfData = await parse(buffer);
                pdfText = pdfData.text;
            }

            // Plagiarism
            plagiarismData = await calculatePlagiarismScore(pdfText);

            // Storage
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const fileName = `${user.id}/${Date.now()}_${safeName}`;
            reportUrl = await StorageService.uploadProjectPDF(arrayBuffer, fileName, file.type);
        }

        // We can reuse updateProjectStatus for status, but for full edits we need a new method or use supabase direct
        // For now, let's assume we just update the metadata in place for 'pending' projects
        const { data, error } = await ProjectService.updateProject(id, user.id, metadata, reportUrl, pdfText, plagiarismData);

        if (error) throw new Error(error);

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        await ProjectService.deleteSubmission(id, user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
