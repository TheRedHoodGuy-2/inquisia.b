import { supabaseAdmin } from "@/lib/supabase-admin";

export class ChangeRequestService {
    static async submitRequest(projectId: string, studentId: string, payload: {
        fields: string[];
        reason: string;
        proposedData: any;
        newReportUrl?: string;
        newPdfText?: string;
        newPlagiarismData?: { score: number; similarProjectId?: string; similarityReason?: string };
    }) {
        // 1. One at a time rule - check if a pending request exists
        const { data: existingRequest } = await supabaseAdmin
            .from("change_requests")
            .select("id")
            .eq("project_id", projectId)
            .eq("status", "pending")
            .single();

        if (existingRequest) {
            throw new Error("A change request is already pending for this project.");
        }

        // 2. Create the request
        const { data, error } = await supabaseAdmin
            .from("change_requests")
            .insert({
                project_id: projectId,
                student_id: studentId,
                status: "pending",
                fields: payload.fields,
                reason: payload.reason,
                proposed_data: payload.proposedData,
                new_report_url: payload.newReportUrl,
                new_pdf_text: payload.newPdfText,
                new_plagiarism_score: payload.newPlagiarismData?.score,
                similar_project_id: payload.newPlagiarismData?.similarProjectId,
                similarity_reason: payload.newPlagiarismData?.similarityReason
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to submit change request: ${error.message}`);
        }

        return data;
    }

    static async getProjectRequest(projectId: string) {
        const { data, error } = await supabaseAdmin
            .from("change_requests")
            .select("*")
            .eq("project_id", projectId)
            .eq("status", "pending")
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to fetch change request: ${error.message}`);
        }

        return data;
    }

    static async withdrawRequest(requestId: string, studentId: string) {
        const { error } = await supabaseAdmin
            .from("change_requests")
            .update({ status: "withdrawn" })
            .eq("id", requestId)
            .eq("student_id", studentId)
            .eq("status", "pending");

        if (error) {
            throw new Error(`Failed to withdraw request: ${error.message}`);
        }

        return { success: true };
    }

    static async getSupervisorRequests(supervisorId: string) {
        // Get projects assigned to this supervisor
        const { data: projects } = await supabaseAdmin
            .from("projects")
            .select("id")
            .eq("supervisor_id", supervisorId);

        const projectIds = projects?.map(p => p.id) || [];

        if (projectIds.length === 0) return [];

        const { data, error } = await supabaseAdmin
            .from("change_requests")
            .select(`
                *,
                project:project_id(title, uploaded_by),
                student:student_id(full_name, matric_no)
            `)
            .in("project_id", projectIds)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch supervisor change requests: ${error.message}`);
        }

        return data;
    }

    static async resolveRequest(requestId: string, supervisorId: string, status: "approved" | "denied", response: string) {
        // 1. Fetch details and verify supervisor assignment
        const { data: request, error: reqError } = await supabaseAdmin
            .from("change_requests")
            .select(`
                *,
                project:project_id(id, supervisor_id, version, report_url, plagiarism_score, supervisor_feedback)
            `)
            .eq("id", requestId)
            .single();

        if (reqError || !request) {
            throw new Error("Change request not found.");
        }

        if (request.project.supervisor_id !== supervisorId) {
            throw new Error("Not authorized to resolve this request.");
        }

        if (status === "approved") {
            // A. Log current state to version history
            const { error: histError } = await supabaseAdmin
                .from("project_versions")
                .insert({
                    project_id: request.project_id,
                    version_number: request.project.version,
                    report_url: request.project.report_url,
                    plagiarism_score: request.project.plagiarism_score,
                    supervisor_feedback: request.project.supervisor_feedback
                });

            if (histError) console.error("History logging failed:", histError);

            // B. Update live project
            const allowedFields = ['title', 'abstract', 'student_tags', 'github_url', 'live_url', 'presentation_url'];
            const safeData = Object.fromEntries(
                Object.entries(request.proposed_data || {}).filter(([k]) => allowedFields.includes(k))
            );

            const updateData: any = {
                ...safeData,
                updated_at: new Date().toISOString()
            };

            if (request.new_report_url) {
                updateData.report_url = request.new_report_url;
                updateData.pdf_text = request.new_pdf_text;
                updateData.plagiarism_score = request.new_plagiarism_score;
                updateData.plagiarism_flagged = (request.new_plagiarism_score || 0) > 30;
                updateData.similar_project_id = request.similar_project_id;
                updateData.similarity_reason = request.similarity_reason;
            }

            const { error: pError } = await supabaseAdmin
                .from("projects")
                .update(updateData)
                .eq("id", request.project_id);

            if (pError) throw new Error(`Failed to update project: ${pError.message}`);
        }

        // 2. Mark request as resolved
        const { error: resError } = await supabaseAdmin
            .from("change_requests")
            .update({
                status,
                supervisor_response: response,
                resolved_at: new Date().toISOString()
            })
            .eq("id", requestId);

        if (resError) throw new Error(`Failed to resolve request: ${resError.message}`);

        return { success: true };
    }
}
