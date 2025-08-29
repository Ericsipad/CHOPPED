type ImportMetaEnv = { NEXT_PUBLIC_API_BASE_URL?: string; VITE_BACKEND_URL?: string; NEXT_PUBLIC_BACKEND_URL?: string; VITE_FRONTEND_URL?: string; NEXT_PUBLIC_FRONTEND_URL?: string }
type WindowEnv = { NEXT_PUBLIC_API_BASE_URL?: string; VITE_BACKEND_URL?: string; NEXT_PUBLIC_BACKEND_URL?: string; VITE_FRONTEND_URL?: string; NEXT_PUBLIC_FRONTEND_URL?: string }

export function getBackendUrl(): string {
  const fromNextPublicApi = (import.meta as unknown as { env?: ImportMetaEnv }).env?.NEXT_PUBLIC_API_BASE_URL
  const fromVite = (import.meta as unknown as { env?: ImportMetaEnv }).env?.VITE_BACKEND_URL
  const fromNextPublic = (import.meta as unknown as { env?: ImportMetaEnv }).env?.NEXT_PUBLIC_BACKEND_URL
  const fromWindow = (window as unknown as { env?: WindowEnv }).env?.NEXT_PUBLIC_API_BASE_URL || (window as unknown as { env?: WindowEnv }).env?.VITE_BACKEND_URL || (window as unknown as { env?: WindowEnv }).env?.NEXT_PUBLIC_BACKEND_URL
  let url = (fromNextPublicApi || fromVite || fromNextPublic || fromWindow) as string | undefined
  if (!url) {
    console.warn('Backend URL not configured (expected NEXT_PUBLIC_API_BASE_URL, VITE_BACKEND_URL, or NEXT_PUBLIC_BACKEND_URL).')
  }
  if (url) {
    url = url.replace(/\/+$/g, '')
  }
  return (url as string)
}

export function getFrontendUrl(): string {
  const fromVite = (import.meta as unknown as { env?: ImportMetaEnv }).env?.VITE_FRONTEND_URL
  const fromNextPublic = (import.meta as unknown as { env?: ImportMetaEnv }).env?.NEXT_PUBLIC_FRONTEND_URL
  const fromWindow = (window as unknown as { env?: WindowEnv }).env?.VITE_FRONTEND_URL || (window as unknown as { env?: WindowEnv }).env?.NEXT_PUBLIC_FRONTEND_URL
  let url = (fromVite || fromNextPublic || fromWindow || (typeof window !== 'undefined' ? window.location.origin : '')) as string
  if (!fromVite && !fromNextPublic && !fromWindow) {
    console.warn('Frontend URL not configured in frontend env (VITE_FRONTEND_URL or NEXT_PUBLIC_FRONTEND_URL); falling back to window.location.origin.')
  }
  url = url.replace(/\/+$/g, '')
  return url
}


// Bunny token auth is applied by the backend. Frontend no longer appends tokens.


export function getBackendApi(path: string): string {
  const base = getBackendUrl()
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export function getFrontendApi(path: string): string {
  const base = getFrontendUrl()
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

