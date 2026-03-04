import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function align() {
    console.log("Aligning supervisor to student's department (Computer Science)...");

    // Dept ID for Computer Science from diagnostic_db.json
    const csDeptId = "e3875e47-0d97-4070-9bac-c0adb175f2a0";

    const { error } = await supabase
        .from("users")
        .update({ department_id: csDeptId })
        .eq("email", "test@babcock.edu.ng");

    if (error) {
        console.error("Alignment failed:", error);
    } else {
        console.log("Alignment successful.");
    }
}

align();
