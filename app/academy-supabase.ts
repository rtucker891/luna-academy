import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Luna Academy's own Supabase project. This is NOT Luna Accounting's database.
let client: SupabaseClient | null = null;

export function academySupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}
