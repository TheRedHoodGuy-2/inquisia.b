import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnose() {
    const email = "xavier@inquisia.babcock.edu.ng";
    const testPassword = "TestPass123!";

    // 1. Check the public.users record
    const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("id, email, role, is_active, is_verified, account_status, password_hash")
        .eq("email", email)
        .single();

    if (error || !user) {
        console.error("❌ User NOT FOUND in public.users table:", error?.message);
        return;
    }

    console.log("\n✅ User found in public.users:");
    console.log("   id:", user.id);
    console.log("   email:", user.email);
    console.log("   role:", user.role);
    console.log("   is_active:", user.is_active);
    console.log("   is_verified:", user.is_verified);
    console.log("   account_status:", user.account_status);
    console.log("   password_hash:", user.password_hash?.slice(0, 20) + "...");

    // 2. Test bcrypt compare
    const isMatch = await bcrypt.compare(testPassword, user.password_hash);
    console.log(`\n   bcrypt.compare("${testPassword}", hash) =>`, isMatch ? "✅ MATCH" : "❌ NO MATCH");

    // 3. Check sessions table accessibility
    const { error: sessErr } = await supabaseAdmin
        .from("sessions")
        .select("id")
        .limit(1);
    console.log("\n   sessions table accessible:", sessErr ? "❌ " + sessErr.message : "✅ yes");
}

diagnose().catch(console.error);
