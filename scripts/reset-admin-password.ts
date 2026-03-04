import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetAdminPassword() {
    const emails = [
        "xavier@inquisia.babcock.edu.ng",
        "admin@inquisia.babcock.edu.ng"
    ];
    const password = "TestPass123!";
    const hash = await bcrypt.hash(password, 12);
    console.log("Generated hash:", hash);

    for (const email of emails) {
        const { data, error } = await supabaseAdmin
            .from("users")
            .update({ password_hash: hash })
            .eq("email", email)
            .select("id, email, role")
            .single();

        if (error) {
            console.log(`⚠️  ${email}: ${error.message}`);
        } else {
            console.log(`✅ ${email} — password reset. Role: ${data.role}`);
        }
    }

    // Verify
    console.log("\nVerifying...");
    for (const email of emails) {
        const { data: user } = await supabaseAdmin
            .from("users")
            .select("password_hash")
            .eq("email", email)
            .single();
        if (user) {
            const ok = await bcrypt.compare(password, user.password_hash);
            console.log(`  ${email} → bcrypt verify: ${ok ? "✅ PASS" : "❌ FAIL"}`);
        }
    }
}

resetAdminPassword().catch(console.error);
