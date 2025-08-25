import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase URL or anon key is not set in env");
  }

  cachedClient = createClient(url, anonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return cachedClient;
}


