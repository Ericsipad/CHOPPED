import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getBackendApi } from './config'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client
  const url = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL as string
  const anon = (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  if (!url || !anon) {
    throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }
  client = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {},
    },
  })
  return client
}

export async function setRealtimeAuthToken(accessToken: string): Promise<void> {
  const c = getSupabaseClient()
  c.realtime.setAuth(accessToken)
}

export async function setRestAuthToken(accessToken: string): Promise<void> {
  const c = getSupabaseClient()
  // Set Authorization header for PostgREST calls
  // supabase-js v2 supports setting the auth header directly
  await c.auth.setAuth(accessToken)
}

export async function authorizeFromBackend(): Promise<string | null> {
  const backendTokenUrl = getBackendApi('/api/auth/token')
  const res = await fetch(backendTokenUrl, { credentials: 'include' })
  if (!res.ok) return null
  const { access_token } = await res.json().catch(() => ({})) as { access_token?: string }
  if (!access_token) return null
  await setRealtimeAuthToken(access_token)
  const c = getSupabaseClient()
  await c.auth.setAuth(access_token)
  return access_token
}


