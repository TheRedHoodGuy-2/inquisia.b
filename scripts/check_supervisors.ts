import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupervisors() {
    console.log("Checking supervisors in database...");
    const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, role, is_verified, is_active, department_id")
        .eq("role", "supervisor");

    if (error) {
        console.error("Error fetching supervisors:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No supervisors found.");
    } else {
        console.table(data);
    }
}

checkSupervisors();
