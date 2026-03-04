import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { NotificationService } from "@/services/notification.service";

// PATCH /api/notifications/[id]/read — Mark a single notification as read
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const { id } = await params;
        await NotificationService.markOneRead(id, user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message === "Unauthorized" ? 401 : 500 }
        );
    }
}
