import { NextResponse } from 'next/server'
import { getUsersCollection } from '@/lib/mongo'
import { createClient } from '@supabase/supabase-js'

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

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return NextResponse.json(
      { error: 'Missing bearer token' },
      { status: 401, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }

  const accessToken = authHeader.split(' ')[1]
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Supabase env vars not configured' },
      { status: 500, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser()
  if (getUserError || !user) {
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }

  try {
    const users = await getUsersCollection()
    const email = user.email
    if (!email) {
      return NextResponse.json(
        { error: 'User email missing' },
        { status: 400, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
      )
    }

    const now = new Date()
    const update = {
      $setOnInsert: { createdAt: now },
      $set: { email, supabaseUserId: user.id, updatedAt: now },
    }

    await users.updateOne({ email }, update, { upsert: true })
    const doc = await users.findOne({ email })
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


