import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (window as any).env?.VITE_SUPABASE_URL || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Soft throw to aid debugging in dev; backend owns auth flow and envs are expected in DO
  // eslint-disable-next-line no-console
  console.warn('Supabase env vars are missing in frontend.')
}

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string)


