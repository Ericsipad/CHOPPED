import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getBackendApi } from './config'

let client: SupabaseClient | null = null
let currentAccessToken: string | null = null
let cachedUrl: string | null = null
let cachedAnon: string | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client
  const url = ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || (window as any)?.env?.NEXT_PUBLIC_SUPABASE_URL) as string
  const anon = ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || (window as any)?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string
  if (!url || !anon) {
    console.error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)')
    throw new Error('Supabase env vars missing')
  }
  cachedUrl = url
  cachedAnon = anon
  client = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { apikey: anon } },
  })
  return client
}

export async function setRealtimeAuthToken(accessToken: string): Promise<void> {
  const c = getSupabaseClient()
  c.realtime.setAuth(accessToken)
}

export async function authorizeFromBackend(): Promise<string | null> {
  const backendTokenUrl = getBackendApi('/api/auth/token')
  const res = await fetch(backendTokenUrl, { credentials: 'include' })
  if (!res.ok) return null
  const { access_token } = await res.json().catch(() => ({})) as { access_token?: string }
  if (!access_token) return null
  await setRealtimeAuthToken(access_token)
  currentAccessToken = access_token
  return access_token
}

export function getCurrentAccessToken(): string | null {
  return currentAccessToken
}

export function createAuthedClient(): SupabaseClient {
  const url = cachedUrl || ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || (window as any)?.env?.NEXT_PUBLIC_SUPABASE_URL) as string
  const anon = cachedAnon || ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || (window as any)?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string
  const headers: Record<string, string> = {}
  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`
  }
  if (anon) headers['apikey'] = anon
  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers },
  })
}

export function getSupabaseRestInfo(): { url: string; anon: string; accessToken: string | null } {
  const url = cachedUrl || ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || (window as any)?.env?.NEXT_PUBLIC_SUPABASE_URL) as string
  const anon = cachedAnon || ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || (window as any)?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string
  return { url, anon, accessToken: currentAccessToken }
}


