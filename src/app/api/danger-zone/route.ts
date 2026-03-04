import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { email, password, full_name, secret } = await request.json();

        // Server-side secret check
        if (secret !== "12345678") {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        if (!email || !password || !full_name) {
            return NextResponse.json({ success: false, error: "All fields are required." }, { status: 400 });
        }

        // Check if user already exists
        const { data: existing } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ success: false, error: "A user with this email already exists." }, { status: 409 });
        }

        const password_hash = await bcrypt.hash(password, 12);

        const { data: user, error } = await supabaseAdmin
            .from("users")
            .insert({
                email,
                password_hash,
                full_name,
                role: "admin",
                is_verified: true,
                is_active: true,
                account_status: "active",
            })
            .select("id, email, full_name, role")
            .single();

        if (error) {
            console.error("[DangerZone] Insert error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: user });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
