import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { AdminService } from "@/services/admin.service";
import { NotificationService } from "@/services/notification.service";

const ACCOUNT_STATUS_NOTIF: Record<string, { type: any; title: string; msg: (reason: string) => string }> = {
    warned: {
        type: "account_warned",
        title: "⚠️ Account Warning",
        msg: (reason: string) => `Your account has received a warning: ${reason}`,
    },
    restricted: {
        type: "account_restricted",
        title: "🔒 Account Restricted",
        msg: (reason: string) => `Your account has been restricted: ${reason}. Some features may be limited.`,
    },
    banned: {
        type: "account_banned",
        title: "🚫 Account Banned",
        msg: (reason: string) => `Your account has been banned: ${reason}. Contact support if you believe this is an error.`,
    },
};

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

        await AdminService.updateUserStatus(id, admin.id, status, reason);

        // Notify the affected user (fire-and-forget)
        const notifConfig = ACCOUNT_STATUS_NOTIF[status];
        if (notifConfig) {
            await NotificationService.create(
                id,
                notifConfig.type,
                notifConfig.title,
                notifConfig.msg(reason),
                "/profile"
            );
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.message.includes("Forbidden") ? 403 : 500 }
        );
    }
}
