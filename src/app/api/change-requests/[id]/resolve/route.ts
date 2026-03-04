import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { ChangeRequestService } from "@/services/change-request.service";
import { NotificationService } from "@/services/notification.service";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";

const resolveSchema = z.object({
    status: z.enum(["approved", "denied"]),
    response: z.string().min(1, "Response/Reason is required"),
});

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;

        if (user.role !== "supervisor") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const validation = resolveSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { status, response } = validation.data;
        const result = await ChangeRequestService.resolveRequest(id, user.id, status, response);

        // Notify the student(s) who submitted the change request
        try {
            const { data: cr } = await supabaseAdmin
                .from("change_requests")
                .select("requested_by, projects(title)")
                .eq("id", id)
                .single();

            if (cr) {
                const projectTitle = (cr.projects as any)?.title ?? "your project";
                if (status === "approved") {
                    await NotificationService.create(
                        cr.requested_by,
                        "change_request_approved",
                        "✅ Change Request Approved",
                        `Your change request for "${projectTitle}" has been approved.`,
                        `/projects/${(cr as any).project_id}`
                    );
                } else {
                    await NotificationService.create(
                        cr.requested_by,
                        "change_request_denied",
                        "Change Request Denied",
                        `Your change request for "${projectTitle}" was denied: ${response}`,
                        `/projects/${(cr as any).project_id}`
                    );
                }
            }
        } catch (notifErr) {
            console.error("Change request resolution notification failed silently:", notifErr);
        }

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
