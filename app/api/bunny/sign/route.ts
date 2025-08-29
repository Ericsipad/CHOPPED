import { NextResponse } from 'next/server'
import crypto from 'crypto'

const ALLOWED_METHODS = ['POST', 'OPTIONS'] as const

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGIN
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function isOriginAllowed(requestOrigin: string, allowedOrigins: string[]): boolean {
  return allowedOrigins.includes(requestOrigin)
}

function buildCorsHeaders(allowedOrigins: string[], requestOrigin: string | null) {
  const allowOriginHeader =
    requestOrigin && allowedOrigins.length > 0 && isOriginAllowed(requestOrigin, allowedOrigins)
      ? requestOrigin
      : 'null'
  return {
    'Access-Control-Allow-Origin': allowOriginHeader,
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
}

export async function OPTIONS(req: Request) {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = req.headers.get('origin')
  if (allowedOrigins.length > 0 && requestOrigin && !isOriginAllowed(requestOrigin, allowedOrigins)) {
    return new NextResponse(null, {
      status: 403,
      headers: buildCorsHeaders(allowedOrigins, null),
    })
  }
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(allowedOrigins, requestOrigin),
  })
}

type SignRequest = {
  paths: string[]
  expiresInSeconds?: number
}

function getSigningKey(): string | null {
  const env = process.env as Record<string, string | undefined>
  return (
    env.BUNNY_THUMBS_TOKEN_KEY ||
    env.BUNNY_TOKEN_KEY ||
    env.BUNNY_URL_SIGNING_KEY ||
    null
  )
}

function toPathname(input: string): string {
  try {
    const u = new URL(input)
    return u.pathname || '/'
  } catch {
    // Assume already a path
    return input.startsWith('/') ? input : `/${input}`
  }
}

export async function POST(req: Request) {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = req.headers.get('origin')
  const headers = buildCorsHeaders(allowedOrigins, requestOrigin)
  try {
    const key = getSigningKey()
    if (!key) {
      return NextResponse.json({ error: 'SIGNING_KEY_MISSING' }, { status: 500, headers })
    }
    const body = (await req.json().catch(() => null)) as SignRequest | null
    if (!body || !Array.isArray(body.paths)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers })
    }
    const now = Math.floor(Date.now() / 1000)
    const expires = now + Math.max(60, Math.min(24 * 3600, Math.floor(body.expiresInSeconds ?? 3600)))

    const map: Record<string, string> = {}
    for (const raw of body.paths) {
      if (typeof raw !== 'string' || !raw.trim()) continue
      const path = toPathname(raw.trim())
      const token = crypto
        .createHash('md5')
        .update(key + path + String(expires))
        .digest('hex')
      map[path] = `token=${token}&expires=${expires}`
    }

    return NextResponse.json({ authMap: map, expires }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


