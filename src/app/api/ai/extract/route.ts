import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { extractPdfText } from "@/lib/pdf";

export async function POST(request: Request) {
    try {
        // Only authenticated users can extract PDFs
        await requireAuth();

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file || file.type !== "application/pdf") {
            return NextResponse.json({ success: false, error: "A valid PDF file is required" }, { status: 400 });
        }

        let pdfText = "";
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            pdfText = await extractPdfText(buffer);
        } catch (parseError: any) {
            console.error("PDF Parsing failed during extraction:", parseError);
            return NextResponse.json({
                success: false,
                error: `Failed to read PDF content: ${parseError.message || "Unknown error"}. Please ensure it is a valid, unencrypted PDF.`
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            data: { text: pdfText }
        });

    } catch (error: any) {
        console.error("AI Extract API Error:", error);

        if (error.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({
            success: false,
            error: "Failed to read the file. Please try again."
        }, { status: 500 });
    }
}
