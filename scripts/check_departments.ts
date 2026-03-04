import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepartments() {
    console.log("Checking departments...");
    const { data, error } = await supabase.from("departments").select("*");
    if (error) console.error(error);
    else console.table(data);

    console.log("Checking user department distributions...");
    const { data: users, error: userError } = await supabase.from("users").select("email, role, department_id");
    if (userError) console.error(userError);
    else console.table(users);
}

checkDepartments();
