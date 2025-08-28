import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
}

export async function POST(req: Request) {
  const allowedOrigins = getAllowedOrigins()
  const origin = req.headers.get('origin')
  if (allowedOrigins.length > 0 && origin && !isOriginAllowed(origin, allowedOrigins)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers: buildCorsHeaders(allowedOrigins, null) },
    )
  }
  const headers = buildCorsHeaders(allowedOrigins, origin)
  try {
    const body = await req.json()
    const schema = z.object({ email: z.string().email(), password: z.string().min(8) })
    const { email, password } = schema.parse(body)
    const supabase = createSupabaseRouteClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers })

    // After successful sign-in, link Supabase user to Mongo and update metadata (idempotent)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id) {
        const users = await getUsersCollection()
        const now = new Date()
        await users.updateOne(
          { supabaseUserId: user.id },
          { $setOnInsert: { createdAt: now, supabaseUserId: user.id }, $set: { updatedAt: now } },
          { upsert: true },
        )
        const doc = await users.findOne({ supabaseUserId: user.id })
        const mongoIdString = doc?._id?.toString()
        if (mongoIdString) {
          await supabase.auth.updateUser({ data: { mongoUserId: mongoIdString } })
        }
      }
    } catch {
      // Swallow linking errors to avoid blocking sign-in; can be retried later
    }

    return NextResponse.json({ ok: true }, { headers })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Invalid payload'
    return NextResponse.json({ error: message }, { status: 400, headers })
  }
}

export async function OPTIONS(req: Request) {
  const allowedOrigins = getAllowedOrigins()
  const origin = req.headers.get('origin')
  if (allowedOrigins.length > 0 && origin && !isOriginAllowed(origin, allowedOrigins)) {
    return new NextResponse(null, { status: 403, headers: buildCorsHeaders(allowedOrigins, null) })
  }
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(allowedOrigins, origin) })
}


