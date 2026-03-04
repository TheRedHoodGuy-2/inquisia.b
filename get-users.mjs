import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Read from env — never hardcode secrets in source files
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: sups } = await supabase.from('users').select('*').eq('role', 'supervisor');
    console.log("Supervisors:", sups.map(s => s.email));

    const { data: admins } = await supabase.from('users').select('*').eq('role', 'admin');
    console.log("Admins:", admins.map(a => a.email));

    // Also get the auth.users for passwords if we can't remember them
    // Wait, we can't easily get passwords, so let's just make a new admin and new supervisor and set their passwords via supabase admin API or just use the local UI.

    // Instead of doing all that, let's just create a new admin or supervisor if needed, or update the existing ones to have a known password, or just verify one of the supervisors.
}
run();
