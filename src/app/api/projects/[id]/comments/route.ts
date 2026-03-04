import { NextResponse } from "next/server";
import { CommentService } from "@/services/comment.service";
import { NotificationService } from "@/services/notification.service";
import { getSession } from "@/lib/session";
import { ProjectService } from "@/services/project.service";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const project = await ProjectService.getPublicProjectDetail(id);

        if (project.status !== "approved") {
            return NextResponse.json({ success: true, data: [] }); // Comments only exist on approved projects
        }

        const comments = await CommentService.getProjectComments(id);
        return NextResponse.json({ success: true, data: comments });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { content, parent_id } = body;

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 });
        }

        // Verify project is approved before allowing comment
        const project = await ProjectService.getPublicProjectDetail(id);
        if (project.status !== "approved") {
            return NextResponse.json({ success: false, error: "Comments are disabled for this project." }, { status: 403 });
        }

        const newComment = await CommentService.postComment(id, session.user.id, content.trim(), parent_id);

        // If this is a reply, notify the parent comment author (fire-and-forget)
        if (parent_id) {
            try {
                const { data: parentComment } = await supabaseAdmin
                    .from("comments")
                    .select("user_id")
                    .eq("id", parent_id)
                    .single();

                // Don't notify yourself
                if (parentComment && parentComment.user_id !== session.user.id) {
                    const replierName = session.user.display_name || session.user.full_name || "Someone";
                    await NotificationService.create(
                        parentComment.user_id,
                        "comment_reply",
                        "💬 New Reply to Your Comment",
                        `${replierName} replied to your comment on "${project.title}".`,
                        `/projects/${id}#comments`
                    );
                }
            } catch (notifErr) {
                console.error("Comment reply notification failed silently:", notifErr);
            }
        }

        return NextResponse.json({ success: true, data: newComment });
    } catch (error: any) {
        console.error("Post Comment API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
