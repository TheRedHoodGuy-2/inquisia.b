import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySupervisors() {
    console.log("Verifying all supervisors for development...");
    const { data, error } = await supabase
        .from("users")
        .update({ is_verified: true, is_active: true })
        .eq("role", "supervisor");

    if (error) {
        console.error("Error verifying supervisors:", error);
    } else {
        console.log("Supervisors verified successfully.");
    }
}

verifySupervisors();
