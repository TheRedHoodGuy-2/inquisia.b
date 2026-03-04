import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
    console.log('--- Project/Supervisor Assignment Check ---');
    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, title, supervisor_id, status');

    if (error) {
        console.error('Error fetching projects:', error);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('No projects found in DB.');
        return;
    }

    for (const p of projects) {
        const { data: supervisor } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', p.supervisor_id)
            .single();

        console.log(`Project: [${p.title}]`);
        console.log(`- Project ID: ${p.id}`);
        console.log(`- Supervisor ID in Project Table: ${p.supervisor_id}`);
        console.log(`- Supervisor Name: ${supervisor?.full_name || 'NOT FOUND'}`);
        console.log(`- Supervisor Email: ${supervisor?.email || 'N/A'}`);
        console.log(`- Status: ${p.status}`);
        console.log('---');
    }
}

checkProjects();
