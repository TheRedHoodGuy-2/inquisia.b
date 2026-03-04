import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function injectXavier() {
    const email = "xavier@inquisia.babcock.edu.ng";
    const password = "TestPass123!";

    // The schema requires password_hash NOT NULL.
    // Since auth is handled via Supabase Auth (sessions table), we store a placeholder hash.
    // The actual login goes through Supabase Auth, not the password_hash column directly.
    // We use bcrypt-style placeholder that won't be matched in normal flow.
    const placeholderHash = "$2a$12$placeholder_hash_for_supabase_auth_user_xavier_admin_000";

    console.log(`\nChecking if user ${email} exists in auth.users...`);

    // 1. Create or get the Supabase Auth user
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
        console.error("Failed to list auth users:", listError);
        process.exit(1);
    }

    let authUser = users.find(u => u.email === email);

    if (!authUser) {
        console.log("Not found in Supabase Auth. Creating...");
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (createError) {
            console.error("Failed to create Supabase Auth user:", JSON.stringify(createError, null, 2));
            process.exit(1);
        }

        authUser = newUser.user;
        if (!authUser) {
            console.error("No user object returned after creation");
            process.exit(1);
        }
        console.log("Supabase Auth user created. ID:", authUser.id);
    } else {
        console.log("Supabase Auth user exists. ID:", authUser.id);
        // Reset password
        const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password });
        if (pwError) console.warn("Could not reset password:", pwError.message);
    }

    // 2. Check if the public.users record already exists
    const { data: existing, error: checkError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", authUser.id)
        .maybeSingle();

    if (existing) {
        // Update role to ensure they are admin
        console.log("Public user record exists. Updating role to admin...");
        const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({
                role: "admin",
                is_verified: true,
                account_status: "active",
                full_name: "Xavier Admin"
            })
            .eq("id", authUser.id);

        if (updateError) {
            console.error("Failed to update public user:", JSON.stringify(updateError, null, 2));
            process.exit(1);
        }
    } else {
        // Insert fresh record
        console.log("Inserting new public.users record...");
        const { error: insertError } = await supabaseAdmin
            .from("users")
            .insert({
                id: authUser.id,
                email: email,
                password_hash: placeholderHash,
                full_name: "Xavier Admin",
                role: "admin",
                is_verified: true,
                is_active: true,
                account_status: "active"
            });

        if (insertError) {
            console.error("Failed to insert public user:", JSON.stringify(insertError, null, 2));
            process.exit(1);
        }
    }

    console.log("\n✅ Xavier successfully injected!");
    console.log("   Email:    xavier@inquisia.babcock.edu.ng");
    console.log("   Password: TestPass123!");
    console.log("   Role:     admin");
}

injectXavier().catch(console.error);
