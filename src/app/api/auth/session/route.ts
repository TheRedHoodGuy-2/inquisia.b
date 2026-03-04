import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return NextResponse.json({ success: false, user: null }, { status: 401 });
        }
        return NextResponse.json({ success: true, user: session.user });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch session" }, { status: 500 });
    }
}
