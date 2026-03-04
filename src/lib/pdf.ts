/**
 * pdf.ts
 * Shared PDF text extraction utility using pdf-parse v1.
 * Uses dynamic require so Webpack treats it as an external module,
 * which is correctly handled by serverExternalPackages in next.config.ts.
 */

export async function extractPdfText(buffer: Buffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return data.text ?? "";
}
