import { supabaseAdmin } from "@/lib/supabase-admin";

export class StorageService {
    /**
     * Uploads a file buffer to Supabase Storage.
     * @param fileBuffer The buffer containing the file data
     * @param fileName The desired filename destination
     * @param contentType The MIME type (e.g. application/pdf)
     * @returns The public URL of the uploaded file
     */
    static async uploadProjectPDF(fileData: Blob | Buffer | File | ArrayBuffer, fileName: string, contentType: string = "application/pdf"): Promise<string> {
        let size = 0;
        if (fileData instanceof Blob || fileData instanceof File) {
            size = fileData.size;
        } else if (Buffer.isBuffer(fileData)) {
            size = fileData.length;
        } else {
            // @ts-ignore
            size = fileData.byteLength || 0;
        }

        const MAX_SIZE = 10485760;
        if (size > MAX_SIZE) {
            throw new Error("File exceeds the 10MB maximum size limit.");
        }

        if (contentType !== "application/pdf") {
            throw new Error("Only PDF files are allowed.");
        }

        const { data, error } = await supabaseAdmin.storage
            .from("projects")
            .upload(fileName, fileData, {
                contentType,
                upsert: true,
            });

        if (error) {
            console.error("Storage upload raw error:", error);
            throw new Error(`Storage upload failed: ${error.message}${error.cause ? ' (Cause: ' + JSON.stringify(error.cause) + ')' : ''}`);
        }

        const { data: publicUrlData } = supabaseAdmin.storage
            .from("projects")
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    }
}
