import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { StorageService } from "@/services/storage.service";
import { calculatePlagiarismScore } from "@/lib/plagiarism";
import { ProjectService } from "@/services/project.service";
import { AIService } from "@/services/ai.service";
import { projectSubmissionSchema } from "@/schemas";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { NotificationService } from "@/services/notification.service";
import { extractPdfText } from "@/lib/pdf";

export async function GET() {
    try {
        const user = await requireAuth();
        const projects = await ProjectService.getUserProjects(user.id);
        return NextResponse.json({ success: true, data: projects });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireAuth();

        if (user.role !== "student") {
            return NextResponse.json({ success: false, error: "Only students can upload projects" }, { status: 403 });
        }

        const formData = await request.formData();

        // Extract file
        const file = formData.get("file") as File;
        if (!file || file.type !== "application/pdf") {
            return NextResponse.json({ success: false, error: "A valid PDF file is required" }, { status: 400 });
        }

        // Extract and validate metadata
        const metadataString = formData.get("metadata") as string;
        if (!metadataString) {
            return NextResponse.json({ success: false, error: "Submission metadata missing" }, { status: 400 });
        }

        let metadataRaw;
        try {
            metadataRaw = JSON.parse(metadataString);
        } catch {
            return NextResponse.json({ success: false, error: "Invalid metadata format" }, { status: 400 });
        }

        const validation = projectSubmissionSchema.safeParse(metadataRaw);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // Generate a relatively unique filename prefixing the requesting user ID to sandbox
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${user.id}/${Date.now()}_${safeName}`;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage
        let reportUrl = "";
        try {
            reportUrl = await StorageService.uploadProjectPDF(arrayBuffer, fileName, file.type);
        } catch (uploadError: any) {
            return NextResponse.json({ success: false, error: uploadError.message }, { status: 400 });
        }

        // 4. Parse PDF Native Text (skip if frontend already extracted it)
        let pdfText = metadataRaw.pdfText || "";
        if (!pdfText) {
            try {
                pdfText = await extractPdfText(buffer);
            } catch (parseError: any) {
                console.error("PDF Parsing failed:", parseError);
                return NextResponse.json({
                    success: false,
                    error: `Failed to read PDF content: ${parseError.message || "Unknown error"}. Please ensure it is a valid, unencrypted PDF.`
                }, { status: 400 });
            }
        }

        // 5. System Analysis
        const plagiarismData = await calculatePlagiarismScore(pdfText);

        // 6. AI Metadata Generation
        const { data: categoriesData } = await supabaseAdmin.from("ai_categories").select("name");
        const availableCategories = categoriesData?.map(c => c.name) || [];

        const aiMetadata = await AIService.generateProjectMetadata(
            { title: validation.data.title, abstract: validation.data.abstract },
            availableCategories
        );

        // 7. Dispatch payload to Transaction manager 
        const project = await ProjectService.createSubmission(
            validation.data,
            user,
            reportUrl,
            pdfText,
            plagiarismData,
            aiMetadata.category,
            aiMetadata.tags
        );

        // 8. Fire-and-forget: Map the document into the Vector Space for the internal Plagiarism Engine
        AIService.processDocumentEmbeddings(project.id, pdfText)
            .catch(err => console.error("[VECTOR ENGINE] Background mapping failed:", err));

        // 9. Notify the assigned supervisor (fire-and-forget)
        try {
            await NotificationService.create(
                validation.data.supervisor_id,
                "project_uploaded",
                "📥 New Project Submitted",
                `${user.full_name || "A student"} has submitted "${validation.data.title}" for your review.`,
                `/supervisor/projects`
            );
        } catch (notifErr) {
            console.error("Project submission notification failed silently:", notifErr);
        }

        return NextResponse.json({ success: true, data: project }, { status: 201 });

    } catch (error: any) {
        console.error("Submission error:", error);
        if (error.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: error.message || "An unexpected error occurred processing your submission." }, { status: 500 });
    }
}
