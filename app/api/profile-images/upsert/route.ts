import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUserProfileImagesCollection, getUsersCollection } from '@/lib/mongo'
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

    const rawBody = await req.json().catch(() => null)
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers })
    }

    const ThumbSchema = z.object({ name: z.enum(['thumb1','thumb2','thumb3','thumb4','thumb5','thumb6']), url: z.string() })
    const BodySchema = z.object({ main: z.string().optional(), thumbs: z.array(ThumbSchema).optional() })
    const parsed = BodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten() }, { status: 400, headers })
    }
    const { main, thumbs } = parsed.data

    const users = await getUsersCollection()
    const userDoc = await users.findOne({ supabaseUserId: user.id })
    if (!userDoc?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }

    const collection = await getUserProfileImagesCollection()
    const now = new Date()
    const filter = { userId: userDoc._id }
    type UpdateDoc = { $setOnInsert: Record<string, unknown>; $set: Record<string, unknown> }
    const update: UpdateDoc = { $setOnInsert: { userId: userDoc._id, createdAt: now }, $set: { updatedAt: now } }
    if (typeof main === 'string') {
      update.$set.main = main
    }
    if (Array.isArray(thumbs)) {
      // Merge by name
      const existing = await collection.findOne<{ thumbs?: Array<{ name: string; url: string }> }>(filter)
      const existingThumbs: Array<{ name: string, url: string }> = Array.isArray(existing?.thumbs) ? existing!.thumbs! : []
      const map = new Map<string, string>(existingThumbs.map((t) => [t.name, t.url]))
      for (const t of thumbs) {
        map.set(t.name, t.url)
      }
      update.$set.thumbs = Array.from(map.entries()).map(([name, url]) => ({ name, url }))
    }

    await collection.updateOne(filter, update, { upsert: true })
    return NextResponse.json({ ok: true }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


