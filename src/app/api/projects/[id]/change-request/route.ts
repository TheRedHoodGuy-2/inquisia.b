import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { ChangeRequestService } from "@/services/change-request.service";
import { StorageService } from "@/services/storage.service";
import { calculatePlagiarismScore } from "@/lib/plagiarism";
import { NotificationService } from "@/services/notification.service";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Dynamic import for pdf-parse to avoid bundling issues
const pdfParse = require("pdf-parse");

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        const req = await ChangeRequestService.getProjectRequest(id);
        return NextResponse.json({ success: true, data: req });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id: projectId } = await params;

        const formData = await request.formData();
        const fields = JSON.parse(formData.get("fields") as string);
        const reason = formData.get("reason") as string;
        const proposedData = JSON.parse(formData.get("proposedData") as string);
        const reportFile = formData.get("reportFile") as File | null;

        let newReportUrl;
        let newPdfText;
        let newPlagiarismData;

        if (reportFile && fields.includes("PDF Report")) {
            // Process PDF
            const arrayBuffer = await reportFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // PDF Text Extraction
            let pdfText = "";
            try {
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
                newPdfText = pdfText;
            } catch (e) {
                console.error("PDF Parse error in change request:", e);
                throw new Error("Failed to parse PDF for plagiarism check.");
            }

            // Plagiarism Check
            newPlagiarismData = await calculatePlagiarismScore(pdfText);

            // Upload
            const safeName = reportFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const fileName = `${user.id}/cr_${Date.now()}_${safeName}`;
            newReportUrl = await StorageService.uploadProjectPDF(arrayBuffer, fileName, reportFile.type);
        }

        const result = await ChangeRequestService.submitRequest(projectId, user.id, {
            fields,
            reason,
            proposedData,
            newReportUrl,
            newPdfText,
            newPlagiarismData
        });

        // Notify the assigned supervisor (fire-and-forget)
        try {
            const { data: project } = await supabaseAdmin
                .from("projects")
                .select("title, supervisor_id")
                .eq("id", projectId)
                .single();

            if (project?.supervisor_id) {
                const studentName = user.full_name || user.display_name || "A student";
                await NotificationService.create(
                    project.supervisor_id,
                    "change_request_submitted",
                    "📝 Change Request Submitted",
                    `${studentName} has submitted a change request for "${project.title}" requiring your review.`,
                    `/supervisor/change-requests`
                );
            }
        } catch (notifErr) {
            console.error("Change request notification failed silently:", notifErr);
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error("Change request submission error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
