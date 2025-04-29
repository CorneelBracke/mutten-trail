import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL or SUPABASE_KEY is not defined in the environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export function getDbClient() {
  return supabase;
}
