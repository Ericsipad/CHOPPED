import crypto from 'crypto'

function getSigningKey(): string | null {
  const env = process.env as Record<string, string | undefined>
  return (
    env.BUNNY_THUMBS_TOKEN_KEY ||
    env.BUNNY_TOKEN_KEY ||
    env.BUNNY_URL_SIGNING_KEY ||
    null
  )
}

export function signBunnyPath(pathname: string, expiresInSeconds?: number): { token: string; expires: number; query: string } {
  const key = getSigningKey()
  if (!key) {
    throw new Error('BUNNY_SIGNING_KEY_MISSING')
  }
  const now = Math.floor(Date.now() / 1000)
  const expires = now + Math.max(60, Math.min(24 * 3600, Math.floor(expiresInSeconds ?? (24 * 3600))))
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`
  const token = crypto
    .createHash('md5')
    .update(key + path + String(expires))
    .digest('hex')
  const query = `token=${token}&expires=${expires}`
  return { token, expires, query }
}

export function signBunnyUrl(inputUrl: string, expiresInSeconds?: number): string {
  try {
    const u = new URL(inputUrl)
    const { query } = signBunnyPath(u.pathname, expiresInSeconds)
    const joiner = u.search && u.search.length > 1 ? '&' : '?'
    return `${u.toString()}${joiner}${query}`
  } catch {
    // If input is not a valid URL, attempt to treat it as already public path
    const { query } = signBunnyPath(inputUrl, expiresInSeconds)
    return `${inputUrl}${inputUrl.includes('?') ? '&' : '?'}${query}`
  }
}


