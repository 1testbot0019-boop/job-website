import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project settings -> API.
// Use the PUBLIC anon key here, never the service_role key (that stays
// server-side, in the scraper's GitHub Actions secrets only).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
