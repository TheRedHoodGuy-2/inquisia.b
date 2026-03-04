import { NextResponse } from "next/server";
import { registerSchema } from "@/schemas";
import { AuthService } from "@/services/auth.service";
import { createSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // 1. Zod Validation
        const validation = registerSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        // 2. Auth Service execution
        const { user, token, expiresAt } = await AuthService.register(validation.data);

        // 3. Create Session Cookie
        await createSessionCookie(token, expiresAt);

        // 4. Return success response (never returning the password hash)
        return NextResponse.json({ success: true, data: user }, { status: 201 });

    } catch (error: any) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "An unexpected error occurred during registration." },
            { status: 400 }
        );
    }
}
