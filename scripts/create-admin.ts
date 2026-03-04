import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
    const email = "admin@inquisia.babcock.edu.ng";
    const password = "TestPass123!";
    const passwordHash = await bcrypt.hash(password, 10);

    console.log(`Checking for existing admin user: ${email}`);

    // 1. Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

    if (checkError && checkError.code !== "PGRST116") { // 116 represents 0 rows
        console.error("Error checking for existing user:", checkError);
        process.exit(1);
    }

    if (existingUser) {
        console.log("Admin user already exists. Updating password hash just in case.");

        const { error: updateError } = await supabaseAdmin
            .from("users")
            .update({
                password_hash: passwordHash,
                role: "admin",
                is_active: true,
                is_verified: true,
                account_status: "active"
            })
            .eq("email", email);

        if (updateError) {
            console.error("Failed to update admin user:", updateError);
            process.exit(1);
        } else {
            console.log("Admin account successfully refreshed. Password is: TestPass123!");
        }
        return;
    }

    console.log("Admin user not found, inserting new Super Admin...");

    // 2. Insert new user
    const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
            email,
            password_hash: passwordHash,
            role: "admin",
            full_name: "Inquisia Administrator",
            display_name: "Super Admin",
            is_verified: true,
            is_active: true,
            account_status: "active"
        });

    if (insertError) {
        console.error("Failed to create admin user:", insertError);
        process.exit(1);
    }

    console.log("Super Admin account successfully created. Password is: TestPass123!");
}

createSuperAdmin().catch(console.error);
