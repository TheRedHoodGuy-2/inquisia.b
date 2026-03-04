import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    const { data: departments } = await supabase.from("departments").select("*");
    const { data: users } = await supabase.from("users").select("email, role, department_id, is_verified");

    const diagnosticData = {
        departments,
        users
    };

    fs.writeFileSync("diagnostic_db.json", JSON.stringify(diagnosticData, null, 2));
    console.log("Diagnostic data written to diagnostic_db.json");
}

diagnose();
