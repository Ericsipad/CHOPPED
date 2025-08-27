export function getBackendUrl(): string {
  const fromNextPublicApi = (import.meta as any).env?.NEXT_PUBLIC_API_BASE_URL
  const fromVite = (import.meta as any).env?.VITE_BACKEND_URL
  const fromNextPublic = (import.meta as any).env?.NEXT_PUBLIC_BACKEND_URL
  const fromWindow = (window as any).env?.NEXT_PUBLIC_API_BASE_URL || (window as any).env?.VITE_BACKEND_URL || (window as any).env?.NEXT_PUBLIC_BACKEND_URL
  let url = (fromNextPublicApi || fromVite || fromNextPublic || fromWindow) as string | undefined
  if (!url) {
    // eslint-disable-next-line no-console
    console.warn('Backend URL not configured (expected NEXT_PUBLIC_API_BASE_URL, VITE_BACKEND_URL, or NEXT_PUBLIC_BACKEND_URL).')
  }
  if (url) {
    url = url.replace(/\/+$/g, '')
  }
  return (url as string)
}

export function getFrontendUrl(): string {
  const fromVite = (import.meta as any).env?.VITE_FRONTEND_URL
  const fromNextPublic = (import.meta as any).env?.NEXT_PUBLIC_FRONTEND_URL
  const fromWindow = (window as any).env?.VITE_FRONTEND_URL || (window as any).env?.NEXT_PUBLIC_FRONTEND_URL
  let url = (fromVite || fromNextPublic || fromWindow || (typeof window !== 'undefined' ? window.location.origin : '')) as string
  if (!fromVite && !fromNextPublic && !fromWindow) {
    // eslint-disable-next-line no-console
    console.warn('Frontend URL not configured in frontend env (VITE_FRONTEND_URL or NEXT_PUBLIC_FRONTEND_URL); falling back to window.location.origin.')
  }
  url = url.replace(/\/+$/g, '')
  return url
}


export function getBunnyAuthQuery(): string {
  const w = window as any
  const candidates = [
    // Common patterns used across apps
    w.BUNNY_AUTH_QUERY,
    w.BUNNY_AUTH,
    w.CDN_AUTH_QUERY,
    w.CDN_AUTH,
    w.BUNNY_QUERY,
    w.CDN_QUERY,
    // window.env fallbacks if provided by platform
    w.env?.BUNNY_AUTH_QUERY,
    w.env?.BUNNY_AUTH,
    w.env?.CDN_AUTH_QUERY,
    w.env?.CDN_AUTH,
    w.env?.BUNNY_QUERY,
    w.env?.CDN_QUERY,
    w.env?.VITE_BUNNY_AUTH_QUERY,
    w.env?.NEXT_PUBLIC_BUNNY_AUTH_QUERY,
  ]
  let query = candidates.find((v: unknown) => typeof v === 'string' && v.trim().length > 0) as string | undefined
  if (!query) return ''
  query = query.trim()
  // Normalize to not include a leading ? or &
  if (query.startsWith('?') || query.startsWith('&')) {
    query = query.slice(1)
  }
  return query
}


