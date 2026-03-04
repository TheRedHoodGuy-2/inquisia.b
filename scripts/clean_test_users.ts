import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    const emails = ['okpalannajiakux8982@student.babcock.edu.ng', 'number.one.xavier@gmail.com'];
    const { error } = await supabase.from('users').delete().in('email', emails);
    if (error) console.error('Error:', error);
    else console.log('Cleaned up emails:', emails.join(', '));
}

run();
