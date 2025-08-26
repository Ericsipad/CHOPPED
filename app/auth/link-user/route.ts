import { NextResponse } from 'next/server'
import { getUsersCollection } from '@/lib/mongo'
import { z } from 'zod'
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
  if (allowedOrigins.length > 0 && requestOrigin && !isOriginAllowed(requestOrigin, allowedOrigins)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers: buildCorsHeaders(allowedOrigins, null) },
    )
  }
  // Validate body shape even if unused (future fields)
  try {
    const body = await req.json().catch(() => ({}))
    z.object({}).passthrough().parse(body)
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }
  const supabase = createSupabaseRouteClient()

  const { data: { user }, error: getUserError } = await supabase.auth.getUser()
  if (getUserError || !user) {
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }

  try {
    const users = await getUsersCollection()
    const now = new Date()
    const update = {
      $setOnInsert: { createdAt: now, supabaseUserId: user.id },
      $set: { updatedAt: now },
    }

    await users.updateOne({ supabaseUserId: user.id }, update, { upsert: true })
    const doc = await users.findOne({ supabaseUserId: user.id })
    const mongoIdString = doc?._id?.toString()

    if (mongoIdString) {
      await supabase.auth.updateUser({ data: { mongoUserId: mongoIdString } })
    }

    return NextResponse.json(
      { ok: true, mongoUserId: mongoIdString ?? null, supabaseUserId: user.id },
      { headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  } catch {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }
}


