import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getUsersCollection } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

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

export async function POST(req: Request) {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = req.headers.get('origin')
  const headers = buildCorsHeaders(allowedOrigins, requestOrigin)
  try {
    // Try cookie-based session first
    const supabaseFromCookies = createSupabaseRouteClient()
    let { data: { user } } = await supabaseFromCookies.auth.getUser()
    // If not present, try Bearer token from Authorization header
    if (!user) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || ''
      const m = /^Bearer\s+(.+)$/.exec(authHeader)
      if (m) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
        const supabase = createClient(supabaseUrl, supabaseAnonKey)
        const byToken = await supabase.auth.getUser(m[1])
        user = byToken.data.user || null
      }
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })

    const users = await getUsersCollection()
    let userDoc = await users.findOne({ supabaseUserId: user.id })
    // Auto-create user doc if not present
    if (!userDoc?._id) {
      const now = new Date()
      await users.updateOne(
        { supabaseUserId: user.id },
        { $setOnInsert: { createdAt: now, supabaseUserId: user.id }, $set: { updatedAt: now } },
        { upsert: true },
      )
      userDoc = await users.findOne({ supabaseUserId: user.id })
    }
    if (!userDoc?._id) return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })

    await users.updateOne(
      { _id: userDoc._id },
      {
        $set: {
          choppedmatch_array: [new ObjectId('666666666666666666666666')],
          pendingmatch_array: [
            {
              userId: new ObjectId('777777777777777777777777'),
              mainImageUrl: 'https://example.com/fake-main-image.jpg',
            },
          ],
          Match_array: [
            {
              matchedUserId: '888888888888888888888888',
              mainImageUrl: 'https://example.com/fake-main-image-2.jpg',
              matchStatus: 'pending',
            }
          ],
        },
      },
    )

    return NextResponse.json({ ok: true }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


