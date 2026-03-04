import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { ProjectService } from "@/services/project.service";
import { NotificationService } from "@/services/notification.service";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";

const statusSchema = z.object({
    status: z.enum(["approved", "changes_requested", "rejected"]),
    feedback: z.string().min(1, "Feedback is required"),
});

const STATUS_NOTIF = {
    approved: {
        type: "project_approved" as const,
        title: "🎉 Project Approved!",
        msg: (title: string) => `Your project "${title}" has been approved and is now live on Inquisia.`,
    },
    rejected: {
        type: "project_rejected" as const,
        title: "Project Rejected",
        msg: (title: string) => `Your project "${title}" has been rejected. Please review the supervisor feedback.`,
    },
    changes_requested: {
        type: "project_changes_requested" as const,
        title: "Changes Requested",
        msg: (title: string) => `Your supervisor has requested changes on "${title}". Please review their feedback and resubmit.`,
    },
};

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requireAuth();

        if (user.role !== "supervisor") {
            return NextResponse.json({ success: false, error: "Only supervisors can update project status" }, { status: 403 });
        }

        const body = await request.json();
        const validation = statusSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const { status, feedback } = validation.data;
        const result = await ProjectService.updateProjectStatus(id, user.id, status, feedback);

        // Fire notifications to all project authors (fire-and-forget)
        try {
            const { data: project } = await supabaseAdmin
                .from("projects")
                .select("title, project_authors(student_id)")
                .eq("id", id)
                .single();

            if (project) {
                const notifConfig = STATUS_NOTIF[status];
                const authorIds = (project.project_authors as any[]).map((a) => a.student_id);
                if (authorIds.length > 0) {
                    await NotificationService.createBulk(
                        authorIds,
                        notifConfig.type,
                        notifConfig.title,
                        notifConfig.msg(project.title),
                        `/projects/${id}`
                    );
                }
            }
        } catch (notifErr) {
            console.error("Status notification failed silently:", notifErr);
        }

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error("Status update error:", error);
        if (error.message === "Unauthorized") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ success: false, error: error.message || "An unexpected error occurred." }, { status: 500 });
    }
}
