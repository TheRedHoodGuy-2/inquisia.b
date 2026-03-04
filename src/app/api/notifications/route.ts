import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { NotificationService } from "@/services/notification.service";

// GET /api/notifications — Fetch current user's notifications
export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const notifications = await NotificationService.getUserNotifications(user.id);
        const unreadCount = notifications.filter((n) => !n.is_read).length;
        return NextResponse.json({ success: true, data: notifications, unreadCount });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message === "Unauthorized" ? 401 : 500 }
        );
    }
}
