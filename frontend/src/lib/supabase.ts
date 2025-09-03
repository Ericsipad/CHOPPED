import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getBackendApi } from './config'

let client: SupabaseClient | null = null
let currentAccessToken: string | null = null
let cachedUrl: string | null = null
let cachedAnon: string | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client
  
  // Try multiple sources for Supabase configuration
  const url = ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL || 
               (window as any)?.env?.NEXT_PUBLIC_SUPABASE_URL ||
               'https://pnvbhxmemotrrmjyacen.supabase.co') as string // Fallback to known project URL
  const anon = ((import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                (window as any)?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudmJoeG1lbW90cnJtanlhY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTAwNDAsImV4cCI6MjA3MTcyNjA0MH0.Xquu_IYlFMvTZ1wdaJHPLaIsyqjRJn5myQ2z1FsAF5s') as string // Fallback to known anon key
  
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

async function loadConfigFromBackend(): Promise<{ url: string; anon: string } | null> {
  try {
    const res = await fetch(getBackendApi('/api/config/supabase'))
    if (!res.ok) return null
    const data = await res.json().catch(() => null) as { url?: string; anonKey?: string } | null
    const url = data?.url || ''
    const anon = data?.anonKey || ''
    if (!url || !anon) return null
    cachedUrl = url
    cachedAnon = anon
    return { url, anon }
  } catch {
    return null
  }
}

export async function getSupabaseClientAsync(): Promise<SupabaseClient> {
  if (client) return client
  try {
    return getSupabaseClient()
  } catch {
    // Try to load config from backend as fallback
    const cfg = await loadConfigFromBackend()
    if (!cfg) {
      console.warn('Backend config unavailable, using hardcoded fallback')
      // Use known project configuration as final fallback
      const url = 'https://pnvbhxmemotrrmjyacen.supabase.co'
      const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudmJoeG1lbW90cnJtanlhY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTAwNDAsImV4cCI6MjA3MTcyNjA0MH0.Xquu_IYlFMvTZ1wdaJHPLaIsyqjRJn5myQ2z1FsAF5s'
      cachedUrl = url
      cachedAnon = anon
      client = createClient(url, anon, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { apikey: anon } },
      })
      return client
    }
    cachedUrl = cfg.url
    cachedAnon = cfg.anon
    client = createClient(cfg.url, cfg.anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { apikey: cfg.anon } },
    })
    return client
  }
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

export async function createAuthedClientAsync(): Promise<SupabaseClient> {
  if (!client) await getSupabaseClientAsync()
  const url = cachedUrl as string
  const anon = cachedAnon as string
  const headers: Record<string, string> = {}
  if (currentAccessToken) headers['Authorization'] = `Bearer ${currentAccessToken}`
  headers['apikey'] = anon
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers },
  })
}


