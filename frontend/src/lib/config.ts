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


