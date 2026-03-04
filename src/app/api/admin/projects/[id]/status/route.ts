import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { AdminService } from "@/services/admin.service";
import { NotificationService } from "@/services/notification.service";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin();
        const { id } = await params;
        const { status, reason } = await request.json();

        if (!status || !reason) {
            return NextResponse.json({ success: false, error: "Status and reason are required" }, { status: 400 });
        }

        // Fetch project info for notifications BEFORE updating
        const { data: project } = await supabaseAdmin
            .from("projects")
            .select("title, uploaded_by, supervisor_id")
            .eq("id", id)
            .single();

        await AdminService.updateProjectStatus(id, admin.id, status, reason);

        // Notify affected users
        if (project) {
            const notifTitle = "🔧 Admin Intervention";
            const notifMsg = `An admin has forcefully changed the status of your project "${project.title}" to '${status}'. Reason: ${reason}`;
            const link = `/projects/${id}`;

            // Notify Student
            await NotificationService.create(
                project.uploaded_by,
                "project_rejected", // Reusing a type that implies attention needed
                notifTitle,
                notifMsg,
                link
            ).catch(err => console.error("Admin student notif error:", err));

            // Notify Supervisor
            if (project.supervisor_id) {
                await NotificationService.create(
                    project.supervisor_id,
                    "project_rejected",
                    notifTitle,
                    notifMsg,
                    link
                ).catch(err => console.error("Admin supervisor notif error:", err));
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message.includes("Forbidden") ? 403 : 500 }
        );
    }
}
