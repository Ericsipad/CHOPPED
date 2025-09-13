import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'
import { z } from 'zod'

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

const BodySchema = z.object({
  videoId: z.string(),
})

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

    const raw = await req.json().catch(() => null)
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400, headers })
    }
    const { videoId } = parsed.data

    const users = await getUsersCollection()
    const userDoc = await users.findOne({ supabaseUserId: user.id })
    if (!userDoc?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }

    await users.updateOne(
      { _id: userDoc._id },
      { $pull: { profile_videos: { id: videoId } } },
    )

    return NextResponse.json({ ok: true }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


