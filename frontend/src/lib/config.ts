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
  // Prefer explicit values matching Bunny docs
  const token = (w.env?.BUNNY_TOKEN ?? w.BUNNY_TOKEN) as string | undefined
  const expires = (w.env?.BUNNY_EXPIRES ?? w.BUNNY_EXPIRES) as string | undefined
  const ip = (w.env?.BUNNY_IP ?? w.BUNNY_IP) as string | undefined
  const tokenPath = (w.env?.BUNNY_TOKEN_PATH ?? w.BUNNY_TOKEN_PATH) as string | undefined

  const params: string[] = []
  if (typeof token === 'string' && token.trim()) params.push(`token=${encodeURIComponent(token.trim())}`)
  if (typeof expires === 'string' && expires.trim()) params.push(`expires=${encodeURIComponent(expires.trim())}`)
  if (typeof ip === 'string' && ip.trim()) params.push(`ip=${encodeURIComponent(ip.trim())}`)
  if (typeof tokenPath === 'string' && tokenPath.trim()) params.push(`token_path=${encodeURIComponent(tokenPath.trim())}`)

  if (params.length === 0) {
    // Fallback to a prebuilt query, if provided
    const prebuilt = (w.env?.BUNNY_AUTH_QUERY ?? w.BUNNY_AUTH_QUERY) as string | undefined
    if (typeof prebuilt === 'string' && prebuilt.trim()) {
      const clean = prebuilt.trim().replace(/^[?&]/, '')
      return clean
    }
    return ''
  }
  // Maintain documented param names; order does not affect correctness of appending
  return params.join('&')
}

export function appendBunnyAuth(baseUrl: string): string {
  try {
    const w = window as any
    // Optional per-path map: { "/Gemini_Generated_Image_...png": "token=...&expires=...", ... }
    const authMap = (w.BUNNY_AUTH_MAP || w.env?.BUNNY_AUTH_MAP) as Record<string, string> | undefined
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


