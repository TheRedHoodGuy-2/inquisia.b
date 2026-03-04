import { NextResponse } from "next/server";
import { CommentService } from "@/services/comment.service";
import { getSession } from "@/lib/session";

export async function PATCH(
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
        const { content } = body;

        if (!content || typeof content !== "string" || content.trim().length === 0) {
            return NextResponse.json({ success: false, error: "Comment content is required" }, { status: 400 });
        }

        const updatedComment = await CommentService.editComment(id, session.user.id, content.trim());
        return NextResponse.json({ success: true, data: updatedComment });
    } catch (error: any) {
        console.error("Patch Comment API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        if (session.user.role === "admin") {
            // Hard Delete
            await CommentService.hardDeleteComment(id);
        } else {
            // Soft Delete
            await CommentService.softDeleteComment(id, session.user.id);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Comment API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
    }
}
