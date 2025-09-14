import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

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

    const body = await req.json().catch(() => null) as { senderUserId?: string; createdAt?: string; accepted?: boolean; stripeTransactionId?: string | null } | null
    const senderUserId = typeof body?.senderUserId === 'string' ? body!.senderUserId : ''
    const createdAtStr = typeof body?.createdAt === 'string' ? body!.createdAt : ''
    const accepted = typeof body?.accepted === 'boolean' ? body!.accepted : false
    const stripeTransactionId = typeof body?.stripeTransactionId === 'string' ? body!.stripeTransactionId : null
    // Require either stripeTransactionId OR legacy keys
    if (!stripeTransactionId && (!senderUserId || !createdAtStr)) {
      return NextResponse.json({ error: 'Missing stripeTransactionId or senderUserId+createdAt' }, { status: 400, headers })
    }
    let createdAt: Date | null = null
    if (!stripeTransactionId) {
      try {
        createdAt = new Date(createdAtStr)
        if (Number.isNaN(createdAt.getTime())) throw new Error('invalid')
      } catch {
        return NextResponse.json({ error: 'Invalid createdAt' }, { status: 400, headers })
      }
    }

    const users = await getUsersCollection()
    const viewer = await users.findOne<{ _id?: ObjectId; supabaseUserId?: string }>({ supabaseUserId: user.id })
    if (!viewer?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }

    if (stripeTransactionId) {
      // By Stripe transaction id
      await users.updateOne(
        { _id: viewer._id, 'gifts_got.stripeTransactionId': stripeTransactionId },
        { $set: { 'gifts_got.$.is_accepted': accepted, updatedAt: new Date() } },
      )
      // Sender side: find sender id via gifts_sent with same stripe id and recipient
      await users.updateOne(
        { 'gifts_sent.recipientUserId': viewer._id.toString(), 'gifts_sent.stripeTransactionId': stripeTransactionId },
        { $set: { 'gifts_sent.$.is_accepted': accepted, updatedAt: new Date() } },
      )
    } else {
      // Legacy path by sender + createdAt
      let senderObjId: ObjectId | null = null
      try { senderObjId = new ObjectId(senderUserId) } catch { senderObjId = null }
      if (!senderObjId) {
        return NextResponse.json({ error: 'Invalid senderUserId' }, { status: 400, headers })
      }
      await users.updateOne(
        { _id: viewer._id, 'gifts_got.senderUserId': senderUserId, 'gifts_got.createdAt': createdAt! },
        { $set: { 'gifts_got.$.is_accepted': accepted, updatedAt: new Date() } },
      )
      await users.updateOne(
        { _id: senderObjId, 'gifts_sent.recipientUserId': viewer._id.toString(), 'gifts_sent.createdAt': createdAt! },
        { $set: { 'gifts_sent.$.is_accepted': accepted, updatedAt: new Date() } },
      )
    }

    return NextResponse.json({ ok: true }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


