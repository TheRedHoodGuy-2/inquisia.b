import { NextResponse } from "next/server";
import { destroySessionCookie } from "@/lib/session";

export async function POST(request: Request) {
    try {
        // 1. Destroy Session Cookie
        await destroySessionCookie();

        // 2. Return success
        return NextResponse.json({ success: true, message: "Logged out successfully" }, { status: 200 });
    } catch (error: any) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { success: false, error: "An error occurred during logout." },
            { status: 500 }
        );
    }
}
