import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getBackendApi } from './config'

// Static configuration for deployed frontend
const SUPABASE_URL = 'https://pnvbhxmemotrrmjyacen.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBudmJoeG1lbW90cnJtanlhY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNTAwNDAsImV4cCI6MjA3MTcyNjA0MH0.Xquu_IYlFMvTZ1wdaJHPLaIsyqjRJn5myQ2z1FsAF5s'

let client: SupabaseClient | null = null
let currentAccessToken: string | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client
  
  console.log('[Supabase] Initializing static client with URL:', SUPABASE_URL)
  
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers: { apikey: SUPABASE_ANON_KEY } },
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

// Removed loadConfigFromBackend - not available in static deployment

export async function getSupabaseClientAsync(): Promise<SupabaseClient> {
  // In static deployment, just return the regular client
  return getSupabaseClient()
}

export function createAuthedClient(): SupabaseClient {
  const headers: Record<string, string> = {}
  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`
  }
  headers['apikey'] = SUPABASE_ANON_KEY
  
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers },
  })
}

export function getSupabaseRestInfo(): { url: string; anon: string; accessToken: string | null } {
  return { url: SUPABASE_URL, anon: SUPABASE_ANON_KEY, accessToken: currentAccessToken }
}

export async function createAuthedClientAsync(): Promise<SupabaseClient> {
  const headers: Record<string, string> = {}
  if (currentAccessToken) headers['Authorization'] = `Bearer ${currentAccessToken}`
  headers['apikey'] = SUPABASE_ANON_KEY
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers },
  })
}


