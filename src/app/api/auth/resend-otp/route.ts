import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { EmailService } from "@/services/email.service";

export async function POST(request: Request) {
    try {
        const user = await requireAuth();

        if (user.role === "supervisor") {
            return NextResponse.json({ success: false, error: "Supervisors are manually verified." }, { status: 400 });
        }

        if (user.is_verified) {
            return NextResponse.json({ success: false, error: "Account is already verified." }, { status: 400 });
        }

        // Delete old tokens
        await supabaseAdmin.from("verification_tokens").delete().eq("user_id", user.id);

        // Generate new token
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

        await supabaseAdmin.from("verification_tokens").insert({
            user_id: user.id,
            token: otp,
            expires_at: otpExpiry.toISOString()
        });

        await EmailService.sendOTP(user.email, user.full_name || user.display_name || "User", otp);

        return NextResponse.json({ success: true, message: "Verification code sent." });

    } catch (error: any) {
        console.error("Resend OTP Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "An unexpected error occurred." },
            { status: 400 }
        );
    }
}
