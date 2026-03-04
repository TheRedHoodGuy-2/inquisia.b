import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { BookmarkService } from "@/services/bookmark.service";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const bookmarks = await BookmarkService.getBookmarks(session.user.id);
        return NextResponse.json({ success: true, data: bookmarks });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { project_id } = await request.json();
        if (!project_id) {
            return NextResponse.json({ success: false, error: "Project ID is required" }, { status: 400 });
        }

        const bookmark = await BookmarkService.addBookmark(session.user.id, project_id);
        return NextResponse.json({ success: true, data: bookmark });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
