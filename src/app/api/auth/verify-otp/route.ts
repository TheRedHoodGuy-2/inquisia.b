import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
    try {
        const user = await requireAuth();

        const { code } = await request.json();
        if (!code || typeof code !== "string" || code.trim().length === 0) {
            return NextResponse.json({ success: false, error: "Verification code is required." }, { status: 400 });
        }

        // 1. Check for token
        const { data: tokenRecord, error: findError } = await supabaseAdmin
            .from("verification_tokens")
            .select("*")
            .eq("user_id", user.id)
            .eq("token", code.trim())
            .single();

        if (findError || !tokenRecord) {
            return NextResponse.json({ success: false, error: "Invalid verification code." }, { status: 400 });
        }

        // 2. Check expiration
        if (new Date(tokenRecord.expires_at) < new Date()) {
            // Cleanup expired token
            await supabaseAdmin.from("verification_tokens").delete().eq("id", tokenRecord.id);
            return NextResponse.json({ success: false, error: "Verification code has expired. Please request a new one." }, { status: 400 });
        }

        // 3. Mark user as verified
        const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({ is_verified: true, updated_at: new Date().toISOString() })
            .eq("id", user.id);

        if (updateError) {
            throw new Error(`Failed to verify user: ${updateError.message}`);
        }

        // 4. Cleanup all tokens for this user
        await supabaseAdmin.from("verification_tokens").delete().eq("user_id", user.id);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("OTP Verification Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "An unexpected error occurred." },
            { status: 400 }
        );
    }
}
