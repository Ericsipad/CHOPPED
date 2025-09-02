import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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
    'Cache-Control': 'no-store',
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
  viewerId: z.string().regex(/^[a-fA-F0-9]{24}$/),
  targetUserId: z.string().regex(/^[a-fA-F0-9]{24}$/),
  imageUrl: z.string().min(0).max(2000).optional().nullable(),
  action: z.enum(['chat', 'chop']),
})

type RawMatch = { userId?: unknown; imageUrl?: unknown; status?: unknown; matchedUserId?: unknown; mainImageUrl?: unknown } | null | undefined

function extractUserId(entry: RawMatch): string | null {
  if (!entry || typeof entry !== 'object') return null
  const rec = entry as Record<string, unknown>
  const a = rec.userId
  const b = rec.matchedUserId
  if (typeof a === 'string' && a) return a
  if (typeof b === 'string' && b) return b
  return null
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

    const bodyUnknown = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(bodyUnknown)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers })
    }
    const { viewerId, targetUserId, imageUrl, action } = parsed.data

    // Verify viewerId belongs to the current session, then update via _id = viewerId
    const users = await getUsersCollection()
    const linked = await users.findOne<{ _id?: ObjectId; supabaseUserId?: string }>({ supabaseUserId: user.id })
    if (!linked?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }
    if (linked._id.toHexString() !== viewerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers })
    }

    const viewerObjectId = new ObjectId(viewerId)
    const now = new Date()

    // Load current arrays to compute bump logic deterministically
    const current = await users.findOne<{ Match_array?: unknown; choppedmatch_array?: unknown }>({ _id: viewerObjectId }, { projection: { Match_array: 1, choppedmatch_array: 1 } })
    const matchRaw: RawMatch[] = Array.isArray(current?.Match_array) ? (current!.Match_array as RawMatch[]) : []
    const choppedRaw: RawMatch[] = Array.isArray(current?.choppedmatch_array) ? (current!.choppedmatch_array as RawMatch[]) : []

    // Normalize arrays to fallback shape and dedupe helper
    function toFallback(entry: RawMatch): { userId: string; imageUrl: string | null; status: string | null; createdAt?: unknown } | null {
      const uid = extractUserId(entry)
      if (!uid) return null
      const rec = (entry && typeof entry === 'object') ? (entry as Record<string, unknown>) : {}
      const img = typeof rec.imageUrl === 'string' && rec.imageUrl ? rec.imageUrl
        : (typeof rec.mainImageUrl === 'string' && rec.mainImageUrl ? rec.mainImageUrl : null)
      const status = typeof rec.status === 'string' && rec.status ? rec.status
        : (typeof rec.matchStatus === 'string' && rec.matchStatus ? (rec.matchStatus as string) : null)
      return { userId: uid, imageUrl: img, status, createdAt: (rec as any)?.createdAt }
    }

    function dedupeByUserId(arr: Array<{ userId: string; imageUrl: string | null; status: string | null; createdAt?: unknown }>): Array<{ userId: string; imageUrl: string | null; status: string | null; createdAt?: unknown }> {
      const seen = new Set<string>()
      const out: typeof arr = []
      for (const it of arr) {
        if (!seen.has(it.userId)) {
          seen.add(it.userId)
          out.push(it)
        }
      }
      return out
    }

    let matchArr = dedupeByUserId(matchRaw.map(toFallback).filter((v): v is NonNullable<ReturnType<typeof toFallback>> => v !== null))
    let choppedArr = dedupeByUserId(choppedRaw.map(toFallback).filter((v): v is NonNullable<ReturnType<typeof toFallback>> => v !== null))

    // Remove target from both arrays before re-inserting
    matchArr = matchArr.filter((m) => m.userId !== targetUserId)
    choppedArr = choppedArr.filter((m) => m.userId !== targetUserId)

    if (action === 'chat') {
      const newEntry = { userId: targetUserId, imageUrl: (typeof imageUrl === 'string' ? imageUrl : null), status: 'pending' as const, createdAt: now }
      // Bump oldest from match into chopped if at capacity
      if (matchArr.length >= 50) {
        const bumped = matchArr[matchArr.length - 1]
        if (bumped) {
          // Move bumped into chopped (newest-first) with status 'chopped' preserved or coerced
          const bumpedEntry = { userId: bumped.userId, imageUrl: bumped.imageUrl ?? null, status: 'chopped' as const, createdAt: now }
          choppedArr = [bumpedEntry, ...choppedArr]
        }
        // Drop the last element from match
        matchArr = matchArr.slice(0, 49)
      }
      // Prepend new chat entry
      matchArr = [newEntry, ...matchArr].slice(0, 50)
      // Enforce chopped cap
      if (choppedArr.length > 500) choppedArr = choppedArr.slice(0, 500)
    } else {
      const choppedEntry = { userId: targetUserId, imageUrl: (typeof imageUrl === 'string' ? imageUrl : null), status: 'chopped' as const, createdAt: now }
      choppedArr = [choppedEntry, ...choppedArr].slice(0, 500)
    }

    // Build $set arrays in fallback shape expected by readers
    const setDoc: Record<string, unknown> = {
      Match_array: matchArr.map((e) => ({ userId: e.userId, imageUrl: e.imageUrl ?? '', status: e.status ?? null, createdAt: e.createdAt ?? now })),
      choppedmatch_array: choppedArr.map((e) => ({ userId: e.userId, imageUrl: e.imageUrl ?? '', status: e.status ?? 'chopped', createdAt: e.createdAt ?? now })),
    }

    await users.updateOne(
      { _id: viewerObjectId },
      {
        $set: setDoc,
        $pull: { pendingmatch_array: { userId: targetUserId } },
      },
    )

    return NextResponse.json({ ok: true }, { headers })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: buildCorsHeaders(getAllowedOrigins(), req.headers.get('origin')) })
  }
}


