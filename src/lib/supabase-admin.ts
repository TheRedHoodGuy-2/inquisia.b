import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

/**
 * Trusted Supabase client for server-side operations only.
 * Bypasses RLS policies. NEVER use this in client components.
 */
console.log(`[SupabaseAdmin] Initializing with URL: ${supabaseUrl || 'MISSING'}`);
if (!supabaseKey) console.warn("[SupabaseAdmin] WARNING: SUPABASE_SERVICE_ROLE_KEY is missing!");

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
