import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('--- Debugging Supabase Admin Client ---');
console.log('URL length:', supabaseUrl.length);
console.log('URL starts with space:', supabaseUrl.startsWith(' '));
console.log('URL ends with space:', supabaseUrl.endsWith(' '));
console.log('URL value:', `[${supabaseUrl}]`);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStorage() {
    console.log('\nTesting Storage bucket list...');
    try {
        const { data, error } = await supabase.storage.listBuckets();
        if (error) {
            console.error('Storage list failed:', error.message);
            console.error('Full Error:', error);
        } else {
            console.log('Storage list successful! Buckets:', data.map(b => b.name));
        }
    } catch (e: any) {
        console.error('Fetch exception caught:', e.message);
        if (e.cause) console.error('Cause:', e.cause);
    }
}

testStorage();
