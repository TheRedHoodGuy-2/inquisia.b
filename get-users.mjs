import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rifoqdtxackzjallnobi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZm9xZHR4YWNremphbGxub2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2MTAzNiwiZXhwIjoyMDg3MjM3MDM2fQ.m_MdHZqAB9VLDOWtGXO7irjuZhJaVERjZ8fDc6jlEvg';
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
