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
  const prebuilt = (
    w.env?.BUNNY_AUTH_QUERY ||
    w.Env?.BUNNY_AUTH_QUERY ||
    w.ENV?.BUNNY_AUTH_QUERY ||
    w.BUNNY_AUTH_QUERY
  ) as string | undefined
  if (typeof prebuilt !== 'string' || !prebuilt.trim()) return ''
  return prebuilt.trim().replace(/^[?&]/, '')
}

export function appendBunnyAuth(baseUrl: string): string {
  try {
    const w = window as any
    // Optional per-path map: { "/Gemini_Generated_Image_...png": "token=...&expires=...", ... }
    const authMap = (
      w.BUNNY_AUTH_MAP ||
      w.env?.BUNNY_AUTH_MAP ||
      w.Env?.BUNNY_AUTH_MAP ||
      w.ENV?.BUNNY_AUTH_MAP
    ) as Record<string, string> | undefined
    if (authMap && typeof authMap === 'object') {
      try {
        const urlObj = new URL(baseUrl)
        const pathKey = urlObj.pathname // e.g. /Gemini_Generated_Image_....png
        const mapped = authMap[pathKey] || authMap[pathKey.replace(/^\/+/, '/')]
        if (typeof mapped === 'string' && mapped.trim()) {
          const clean = mapped.trim().replace(/^[?&]/, '')
          return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${clean}`
        }
      } catch {
        // fallback below
      }
    }

    const query = getBunnyAuthQuery()
    if (!query) return baseUrl
    const clean = query.replace(/^[?&]/, '')
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${clean}`
  } catch {
    return baseUrl
  }
}


export function getBackendApi(path: string): string {
  const base = getBackendUrl()
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export function getFrontendApi(path: string): string {
  const base = getFrontendUrl()
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

