import { NextResponse } from "next/server";
import { loginSchema } from "@/schemas";
import { AuthService } from "@/services/auth.service";
import { createSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Zod Validation
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // 2. Auth Service execution (handles credential and banned/active rules validation)
        const { user, token, expiresAt } = await AuthService.login(validation.data);

        // 3. Create Session Cookie
        await createSessionCookie(token, expiresAt);

        // 4. Return success
        return NextResponse.json({ success: true, data: user }, { status: 200 });

    } catch (error: any) {
        console.error("Login error:", error);
        // Important: Always return 401 Unauthorized for bad creds or bans
        return NextResponse.json(
            { success: false, error: error.message || "Invalid credentials" },
            { status: 401 }
        );
    }
}
