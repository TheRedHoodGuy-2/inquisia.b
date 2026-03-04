import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
    const { data, error } = await supabaseAdmin
        .from("projects")
        .select("*")
        .limit(1);

    if (error) {
        fs.writeFileSync('schema_output.json', JSON.stringify({ error }));
    } else {
        const keys = data && data.length > 0 ? Object.keys(data[0]) : [];

        let insertErr = null;
        if (data && data.length > 0) {
            const { error: insertError } = await supabaseAdmin.from("projects").insert({
                title: 'Dummy',
                abstract: 'Dummy',
                report_url: 'Dummy',
                year: 2024,
                supervisor_id: '11111111-1111-1111-1111-111111111111',
                uploaded_by: '11111111-1111-1111-1111-111111111111',
                ai_tags: []
            });
            insertErr = insertError;
        }

        fs.writeFileSync('schema_output.json', JSON.stringify({ keys, insertErr }, null, 2));
    }
}

checkProjects().catch(console.error);
