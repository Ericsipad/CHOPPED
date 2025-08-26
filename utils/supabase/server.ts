import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createSupabaseRouteClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return (cookies() as any).get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        ;(cookies() as any).set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        ;(cookies() as any).set({ name, value: '', ...options })
      },
    },
  })
}


