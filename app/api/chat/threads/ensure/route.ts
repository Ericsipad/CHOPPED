import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'

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

    const body = await req.json().catch(() => null) as { otherUserMongoId?: string } | null
    const otherUserMongoId = body?.otherUserMongoId
    if (!otherUserMongoId || typeof otherUserMongoId !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers })
    }

    const users = await getUsersCollection()
    const meDoc = await users.findOne({ supabaseUserId: user.id })
    if (!meDoc?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }

    const otherDoc = await users.findOne({ _id: (meDoc as any)?._id?.constructor ? (new (meDoc as any)._id.constructor(otherUserMongoId)) : otherUserMongoId })
    // Fallback: attempt by string match of _id
    const other = otherDoc || await users.findOne({ _id: (otherUserMongoId as any) })
    if (!other?._id || !other?.supabaseUserId) {
      return NextResponse.json({ error: 'Other user not found' }, { status: 404, headers })
    }

    const myMongoId = String(meDoc._id)
    const theirMongoId = String(other._id)
    const a = myMongoId < theirMongoId ? myMongoId : theirMongoId
    const b = myMongoId < theirMongoId ? theirMongoId : myMongoId
    const threadId = `${a}__${b}`
    const user_a_mongo_id = a
    const user_b_mongo_id = b
    const user_a_supabase_id = myMongoId < theirMongoId ? user.id : other.supabaseUserId
    const user_b_supabase_id = myMongoId < theirMongoId ? other.supabaseUserId : user.id

    const { error } = await supabase
      .from('chat_threads')
      .upsert({
        thread_id: threadId,
        user_a_mongo_id,
        user_b_mongo_id,
        user_a_supabase_id,
        user_b_supabase_id,
      }, { onConflict: 'thread_id' })

    if (error) {
      return NextResponse.json({ error: 'Upsert failed' }, { status: 500, headers })
    }

    return NextResponse.json({ threadId }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


