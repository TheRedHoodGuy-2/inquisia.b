import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { ProjectService } from "@/services/project.service";
import { StorageService } from "@/services/storage.service";
import { calculatePlagiarismScore } from "@/lib/plagiarism";
import { NotificationService } from "@/services/notification.service";
import { AIService } from "@/services/ai.service";
import { supabaseAdmin } from "@/lib/supabase-admin";

const pdfParse = require("pdf-parse");

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: projectId } = await params;

        const formData = await request.formData();
        const metadata = JSON.parse(formData.get("metadata") as string);
        const file = formData.get("file") as File | null;

        let reportUrl;
        let pdfText;
        let plagiarismData;

        if (file) {
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

            // Pass projectId to exclude its own previous chunks from flagging 100% plagiarism
            plagiarismData = await calculatePlagiarismScore(pdfText, projectId);

            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const fileName = `${user.id}/${Date.now()}_${safeName}`;
            reportUrl = await StorageService.uploadProjectPDF(arrayBuffer, fileName, file.type);
        }

        const result = await ProjectService.resubmitAfterRejection(projectId, user.id, metadata, reportUrl, pdfText, plagiarismData);

        if (file && pdfText) {
            // Background Vector Engine update: Purge old chunks and embed the new file
            (async () => {
                try {
                    await supabaseAdmin.from("project_embeddings").delete().eq("project_id", projectId);
                    await AIService.processDocumentEmbeddings(projectId, pdfText);
                } catch (err) {
                    console.error("[VECTOR ENGINE] Resubmit mapping failed:", err);
                }
            })();
        }

        // Notify the assigned supervisor
        try {
            const { data: project } = await supabaseAdmin
                .from("projects")
                .select("title, supervisor_id")
                .eq("id", projectId)
                .single();

            if (project?.supervisor_id) {
                await NotificationService.create(
                    project.supervisor_id,
                    "project_resubmitted",
                    "📄 Project Resubmitted",
                    `A student has resubmitted "${project.title}" for your review.`,
                    `/supervisor/projects`
                );
            }
        } catch (notifErr) {
            console.error("Resubmit notification failed silently:", notifErr);
        }

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
