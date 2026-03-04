import { NextResponse } from "next/server";
const pdfParse = require("pdf-parse");
import { requireAuth } from "@/lib/session";

export async function POST(request: Request) {
    try {
        // Only authenticated users can extract PDFs
        await requireAuth();

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file || file.type !== "application/pdf") {
            return NextResponse.json({ success: false, error: "A valid PDF file is required" }, { status: 400 });
        }

        // Parse PDF Native Text
        let pdfText = "";
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Resolve the parser - Version 2 (Mehmet Kozan) uses a class-based API
            const parserClass = typeof pdfParse === 'function' ? pdfParse : (pdfParse.PDFParse || pdfParse.default || pdfParse);

            if (typeof parserClass === 'function' && (parserClass.toString().includes('class') || parserClass.name === 'PDFParse')) {
                // Class-based API (v2)
                const instance = new parserClass({ data: buffer });
                const result = await instance.getText();
                pdfText = result.text;
            } else if (typeof parserClass === 'function') {
                // Function-based API (v1 / standard)
                const pdfData = await parserClass(buffer);
                pdfText = pdfData.text;
            } else {
                throw new Error(`PDF parser initialization failed: resolved type is ${typeof parserClass}`);
            }
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
