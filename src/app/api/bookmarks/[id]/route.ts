import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { BookmarkService } from "@/services/bookmark.service";

/**
 * Handles individual bookmark operations using Project ID as the identifier.
 */

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;
        await BookmarkService.removeBookmark(session.user.id, projectId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // This acts as the 'check' endpoint if we want to check status for a specific project
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id: projectId } = await params;
        const isBookmarked = await BookmarkService.isBookmarked(session.user.id, projectId);
        return NextResponse.json({ success: true, data: { is_bookmarked: isBookmarked } });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
