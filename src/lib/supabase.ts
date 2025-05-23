import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_PROJECT_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Anon Key in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
