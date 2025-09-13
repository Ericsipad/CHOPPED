import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSupabaseRouteClient } from '@/utils/supabase/server'

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
    return new NextResponse(null, { status: 403, headers: buildCorsHeaders(allowedOrigins, null) })
  }
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(allowedOrigins, requestOrigin) })
}

export async function POST(req: Request) {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = req.headers.get('origin')
  const headers = buildCorsHeaders(allowedOrigins, requestOrigin)

  try {
    const supabase = createSupabaseRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers })
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers })
    }

    const { guid: rawGuid, videoUrl, expiresInSeconds } = body as { guid?: string; videoUrl?: string; expiresInSeconds?: number }

    const env = process.env as Record<string, string | undefined>
    const libraryId = env.BUNNY_STREAM_LIBRARY_ID
    const embedBase = env.BUNNY_STREAM_PLAYBACK_BASE || 'https://iframe.mediadelivery.net/embed'
    const signingKey = env.BUNNY_STREAM_EMBED_TOKEN_KEY

    if (!libraryId) {
      return NextResponse.json({ error: 'LIBRARY_ID_MISSING' }, { status: 500, headers })
    }
    if (!signingKey) {
      return NextResponse.json({ error: 'EMBED_SIGNING_KEY_MISSING' }, { status: 500, headers })
    }

    let guid = (rawGuid || '').trim()
    if (!guid && typeof videoUrl === 'string' && videoUrl.length > 0) {
      try {
        const u = new URL(videoUrl)
        const parts = u.pathname.split('/').filter(Boolean)
        // Expecting /embed/{libraryId}/{guid}
        guid = parts[parts.length - 1] || ''
      } catch {
        guid = ''
      }
    }

    if (!guid) {
      return NextResponse.json({ error: 'GUID_MISSING' }, { status: 400, headers })
    }

    const expires = Math.floor(Date.now() / 1000) + Math.max(60, Math.min(60 * 60 * 24, Number(expiresInSeconds || 60 * 60)))
    const path = `/${encodeURIComponent(libraryId)}/${encodeURIComponent(guid)}`

    // Bunny Stream embed token auth requires SHA256 HEX of: token_security_key + video_id + expiration
    // Ref: https://docs.bunny.net/docs/stream-embed-token-authentication
    const sha = crypto.createHash('sha256')
    sha.update(`${signingKey}${guid}${expires}`)
    const token = sha.digest('hex')

    const signedUrl = `${embedBase}${path}?token=${encodeURIComponent(token)}&expires=${expires}`
    return NextResponse.json({ signedUrl, guid, expires }, { headers })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('EMBED_TOKEN_UNKNOWN', err)
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500, headers })
  }
}


