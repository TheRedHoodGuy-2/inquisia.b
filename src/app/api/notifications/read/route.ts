import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { NotificationService } from "@/services/notification.service";

// PATCH /api/notifications/read — Mark ALL notifications as read
export async function PATCH() {
    try {
        const user = await requireAuth();
        await NotificationService.markAllRead(user.id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message === "Unauthorized" ? 401 : 500 }
        );
    }
}
