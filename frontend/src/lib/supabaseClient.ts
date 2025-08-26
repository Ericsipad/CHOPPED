import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (window as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY

let clientRef: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (clientRef) return clientRef
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars missing (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_ equivalents)')
  }
  clientRef = createClient(supabaseUrl as string, supabaseAnonKey as string)
  return clientRef
}


