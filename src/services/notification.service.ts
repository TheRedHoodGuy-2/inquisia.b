import { supabaseAdmin } from "@/lib/supabase-admin";

export type NotificationType =
    | "comment_reply"
    | "account_warned"
    | "account_restricted"
    | "account_banned"
    | "project_approved"
    | "project_rejected"
    | "project_changes_requested"
    | "change_request_approved"
    | "change_request_denied"
    | "project_uploaded"
    | "project_resubmitted"
    | "change_request_submitted";

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export class NotificationService {
    /**
     * Creates a single notification for a user.
     * Silently fails to avoid breaking the primary action if DB write fails.
     */
    static async create(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        link?: string
    ): Promise<void> {
        try {
            const { error } = await supabaseAdmin.from("notifications").insert({
                user_id: userId,
                type,
                title,
                message,
                link: link ?? null,
            });
            if (error) console.error("NotificationService.create error:", error);
        } catch (err) {
            console.error("NotificationService.create exception:", err);
        }
    }

    /**
     * Creates notifications for multiple users at once (e.g. multiple co-authors).
     */
    static async createBulk(
        userIds: string[],
        type: NotificationType,
        title: string,
        message: string,
        link?: string
    ): Promise<void> {
        if (!userIds.length) return;
        try {
            const rows = userIds.map((userId) => ({
                user_id: userId,
                type,
                title,
                message,
                link: link ?? null,
            }));
            const { error } = await supabaseAdmin.from("notifications").insert(rows);
            if (error) console.error("NotificationService.createBulk error:", error);
        } catch (err) {
            console.error("NotificationService.createBulk exception:", err);
        }
    }

    /**
     * Fetches the 50 most recent notifications for a user.
     */
    static async getUserNotifications(userId: string): Promise<Notification[]> {
        const { data, error } = await supabaseAdmin
            .from("notifications")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) throw error;
        return (data as Notification[]) ?? [];
    }

    /**
     * Returns the count of unread notifications for a user.
     */
    static async getUnreadCount(userId: string): Promise<number> {
        const { count, error } = await supabaseAdmin
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) throw error;
        return count ?? 0;
    }

    /**
     * Marks all of a user's notifications as read.
     */
    static async markAllRead(userId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);

        if (error) throw error;
    }

    /**
     * Marks a single notification as read (must belong to the requesting user).
     */
    static async markOneRead(notifId: string, userId: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from("notifications")
            .update({ is_read: true })
            .eq("id", notifId)
            .eq("user_id", userId);

        if (error) throw error;
    }
}
