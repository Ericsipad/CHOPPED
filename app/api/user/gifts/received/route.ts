import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection, getProfileMatchingCollection, getUserProfileImagesCollection } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

type ApiItem = {
  senderUserId: string
  displayName: string | null
  mainImageUrl: string | null
  giftMessage: string | null
  createdAt: string
  is_accepted: boolean
  amountCents: number
  stripeTransactionId?: string | null
}

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

    const url = new URL(req.url)
    const limitParam = url.searchParams.get('limit')
    const offsetParam = url.searchParams.get('offset')
    const limit = (limitParam !== null && limitParam !== '' && Number.isFinite(Number(limitParam)))
      ? Math.max(0, Math.min(500, Number(limitParam)))
      : 50
    const offset = (offsetParam !== null && offsetParam !== '' && Number.isFinite(Number(offsetParam)))
      ? Math.max(0, Number(offsetParam))
      : 0

    const users = await getUsersCollection()
    const viewer = await users.findOne<{ _id?: ObjectId; supabaseUserId?: string }>({ supabaseUserId: user.id })
    if (!viewer?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }

    // Ensure collections exist (invocation ensures index creation in accessors)
    await Promise.all([
      getProfileMatchingCollection().then(() => null).catch(() => null),
      getUserProfileImagesCollection().then(() => null).catch(() => null),
    ])

    const pipeline = [
      { $match: { _id: viewer._id } },
      { $project: { gifts: { $ifNull: ['$gifts_got', []] } } },
      { $unwind: '$gifts' },
      { $match: { 'gifts.is_accepted': false, 'gifts.withdrawn': false } },
      {
        $set: {
          senderStr: '$gifts.senderUserId',
        }
      },
      // Lookup displayName from Profile_Matching
      {
        $lookup: {
          from: 'Profile_Matching',
          let: { sid: '$senderStr' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$userId', { $toObjectId: '$$sid' }]
                }
              }
            },
            { $project: { _id: 0, displayName: 1 } },
          ],
          as: 'prof',
        }
      },
      // Lookup main image from USER_PROFILE_IMAGES
      {
        $lookup: {
          from: 'USER_PROFILE_IMAGES',
          let: { sid: '$senderStr' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$userId', { $toObjectId: '$$sid' }]
                }
              }
            },
            { $project: { _id: 0, main: 1 } },
          ],
          as: 'imgs',
        }
      },
      { $set: { displayName: { $ifNull: [{ $first: '$prof.displayName' }, null] } } },
      { $set: { mainImageUrl: { $ifNull: [{ $first: '$imgs.main' }, null] } } },
      { $sort: { 'gifts.createdAt': -1 as 1 | -1 } },
      { $skip: offset },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          senderUserId: '$gifts.senderUserId',
          displayName: 1,
          mainImageUrl: 1,
          giftMessage: { $ifNull: ['$gifts.giftMessage', null] },
          createdAt: { $toString: '$gifts.createdAt' },
          is_accepted: { $ifNull: ['$gifts.is_accepted', false] },
          amountCents: { $ifNull: ['$gifts.amountCents', 0] },
          stripeTransactionId: { $ifNull: ['$gifts.stripeTransactionId', null] },
        }
      }
    ] as import('mongodb').Document[]

    const cursor = users.aggregate<ApiItem>(pipeline)
    const items: ApiItem[] = []
    for await (const row of cursor) {
      items.push({
        senderUserId: typeof row.senderUserId === 'string' ? row.senderUserId : '',
        displayName: row.displayName ?? null,
        mainImageUrl: row.mainImageUrl ?? null,
        giftMessage: row.giftMessage ?? null,
        createdAt: row.createdAt,
        is_accepted: !!row.is_accepted,
        amountCents: typeof row.amountCents === 'number' ? row.amountCents : 0,
        stripeTransactionId: typeof row.stripeTransactionId === 'string' ? row.stripeTransactionId : null,
      })
    }

    return NextResponse.json({ items }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


