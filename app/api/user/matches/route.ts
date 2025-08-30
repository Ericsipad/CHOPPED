import { NextResponse } from 'next/server'
import { getUsersCollection } from '@/lib/mongo'
import { createSupabaseRouteClient } from '@/utils/supabase/server'

const ALLOWED_METHODS = ['GET', 'OPTIONS'] as const

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

type RawMatch = { matchedUserId?: unknown; mainImageUrl?: unknown; matchStatus?: unknown } | null | undefined
type RawMatchAlt = { userId?: unknown; imageUrl?: unknown; status?: unknown } | null | undefined
type MatchSlot = { matchedUserId: string; mainImageUrl: string; matchStatus: 'yes' | 'pending' | 'chopped' }

export async function GET(req: Request) {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = req.headers.get('origin')
  const headers = buildCorsHeaders(allowedOrigins, requestOrigin)
  try {
    const supabase = createSupabaseRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })
    }

    const users = await getUsersCollection()
    const userDoc = await users.findOne<{ _id?: unknown; Match_array?: unknown; supabaseUserId?: string }>({ supabaseUserId: user.id })
    if (!userDoc?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }

    const raw = (Array.isArray(userDoc!.Match_array) ? (userDoc!.Match_array as RawMatch[]) : [])
    const limit = 50
    const slots: Array<MatchSlot | null> = new Array(limit).fill(null)
    for (let i = 0; i < Math.min(raw.length, limit); i++) {
      const entry = raw[i] as RawMatch | RawMatchAlt
      if (!entry || typeof entry !== 'object') { continue }
      const matchedUserId = typeof (entry! as RawMatch).matchedUserId === 'string' ? (entry! as RawMatch).matchedUserId : (typeof (entry! as RawMatchAlt).userId === 'string' ? (entry! as RawMatchAlt).userId : '')
      const mainImageUrl = typeof (entry! as RawMatch).mainImageUrl === 'string' ? (entry! as RawMatch).mainImageUrl : (typeof (entry! as RawMatchAlt).imageUrl === 'string' ? (entry! as RawMatchAlt).imageUrl : '')
      const statusRaw = typeof (entry! as RawMatch).matchStatus === 'string' ? (entry! as RawMatch).matchStatus : (typeof (entry! as RawMatchAlt).status === 'string' ? (entry! as RawMatchAlt).status : '')
      const statusLc = statusRaw.toLowerCase()
      const matchStatus = (statusLc === 'yes' || statusLc === 'pending' || statusLc === 'chopped') ? statusLc as MatchSlot['matchStatus'] : null
      if (matchedUserId && mainImageUrl && matchStatus) {
        slots[i] = { matchedUserId, mainImageUrl, matchStatus }
      } else {
        slots[i] = null
      }
    }
    return NextResponse.json({ slots }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


