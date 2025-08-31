import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getProfileMatchingCollection, getUserProfileImagesCollection, getUsersCollection } from '@/lib/mongo'
import type { ObjectId, UpdateFilter } from 'mongodb'

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

type ProfileDoc = {
  userId: ObjectId
  iam?: string
  Iwant?: string
  age?: number
  city?: string
  stateProvince?: string
  country?: string
  healthCondition?: 'hiv' | 'herpes' | 'autism' | 'physical_handicap' | string | null
  Accept_hiv?: boolean
  Accept_Herpes?: boolean
  Accept_Autism?: boolean
  Accept_Physical_Handicap?: boolean
  updatedAt?: Date
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

    const usersCol = await getUsersCollection()
    const userDoc = await usersCol.findOne<{ _id?: ObjectId; Match_array?: unknown; pendingmatch_array?: unknown; choppedmatch_array?: unknown; supabaseUserId?: string }>({ supabaseUserId: user.id })
    if (!userDoc?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }

    const pending = Array.isArray((userDoc as { pendingmatch_array?: unknown }).pendingmatch_array)
      ? ((userDoc as { pendingmatch_array?: Array<{ userId?: unknown }> }).pendingmatch_array as Array<{ userId?: unknown }>)
      : []
    const totalPending = pending.length

    if (totalPending >= 200) {
      return NextResponse.json({ action: 'matchbrowse' }, { headers })
    }

    // Run match search to fill to 500
    const profileCol = await getProfileMatchingCollection()
    const me = await profileCol.findOne<ProfileDoc>({ userId: userDoc._id })
    if (!me) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 400, headers })
    }

    const now = new Date()
    // Ensure helpful indexes (idempotent)
    await Promise.all([
      profileCol.createIndex({ iam: 1, Iwant: 1 }),
      profileCol.createIndex({ city: 1 }),
      profileCol.createIndex({ stateProvince: 1 }),
      profileCol.createIndex({ country: 1 }),
      profileCol.createIndex({ age: 1 }),
    ])

    const existingMatch = new Set<string>()
    const arrs = ['Match_array', 'pendingmatch_array', 'choppedmatch_array'] as const
    for (const key of arrs) {
      const rawArr = (userDoc as Record<string, unknown>)[key]
      const arr = Array.isArray(rawArr) ? (rawArr as Array<unknown>) : []
      for (const it of arr) {
        if (it && typeof it === 'object') {
          const entry = it as Record<string, unknown>
          const a = entry.matchedUserId
          const b = entry.userId
          if (typeof a === 'string' && a) existingMatch.add(a)
          else if (typeof b === 'string' && b) existingMatch.add(b)
        }
      }
    }

    const meId = String(userDoc._id)
    existingMatch.add(meId)

    const needed = Math.max(0, 500 - totalPending)
    let toAdd: Array<{ userId: string; imageUrl: string }> = []
    if (needed > 0) {
      toAdd = await runMatchSearch(profileCol, me as ProfileDoc, existingMatch, needed)
    }

    let addedCount = 0
    if (toAdd.length > 0) {
      // Batch fetch main images
      const imagesCol = await getUserProfileImagesCollection()
      const ids = toAdd.map((a) => a.userId)
      // Convert to ObjectId for lookup in images collection
      const idsObj = ids.map((s) => ({ ok: true as const, id: s })).map((x) => x.id) // keep as string array first
      const imageDocs = await imagesCol
        .find({ userId: { $in: idsObj as unknown as ObjectId[] } })
        .project<{ userId: ObjectId; main?: string | null }>({ userId: 1, main: 1 })
        .toArray()
      const userIdToImage = new Map<string, string>()
      for (const d of imageDocs) {
        const uid = d.userId.toString()
        if (typeof d.main === 'string' && d.main) {
          userIdToImage.set(uid, d.main)
        }
      }
      const filtered = toAdd.filter((a) => userIdToImage.has(a.userId)).map((a) => ({ userId: a.userId, imageUrl: userIdToImage.get(a.userId)! }))

      if (filtered.length > 0) {
        // Dedup against current pending to be safe
        const pendingIds = new Set<string>(
          pending
            .map((p) => (p && typeof p.userId === 'string' ? (p.userId as string) : null))
            .filter((v): v is string => typeof v === 'string')
        )
        const deduped = filtered.filter((a) => !pendingIds.has(a.userId))
        if (deduped.length > 0) {
          await usersCol.updateOne(
            { _id: userDoc._id },
            ({
              $set: { Last_matchsearch: now },
              $push: { pendingmatch_array: { $each: deduped } },
            }) as UpdateFilter<Record<string, unknown>>,
          )
          addedCount = deduped.length
        } else {
          await usersCol.updateOne({ _id: userDoc._id }, { $set: { Last_matchsearch: now } })
        }
      } else {
        await usersCol.updateOne({ _id: userDoc._id }, { $set: { Last_matchsearch: now } })
      }
    } else {
      await usersCol.updateOne({ _id: userDoc._id }, { $set: { Last_matchsearch: now } })
    }

    return NextResponse.json({ action: 'matchsearch', addedCount }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}

async function runMatchSearch(profileCol: Awaited<ReturnType<typeof getProfileMatchingCollection>>, me: ProfileDoc, excludeIds: Set<string>, needed: number): Promise<Array<{ userId: string; imageUrl: string }>> {
  const results: Array<{ userId: string; imageUrl: string }> = []

  const meIam = me.iam
  const meIwant = me.Iwant
  const meAge = typeof me.age === 'number' ? me.age : null
  const meCity = typeof me.city === 'string' ? me.city : null
  const meState = typeof me.stateProvince === 'string' ? me.stateProvince : null
  const meCountry = typeof me.country === 'string' ? me.country : null
  const myCond = typeof me.healthCondition === 'string' && me.healthCondition ? me.healthCondition : null

  // Utility to build health tier filter
  function buildHealthFilter(tier: 1 | 2 | 3): Record<string, unknown> {
    if (!myCond) return {}
    if (tier === 1) {
      // Same condition
      return { healthCondition: myCond }
    } else if (tier === 2) {
      const acceptField = myCond === 'hiv' ? 'Accept_hiv'
        : myCond === 'herpes' ? 'Accept_Herpes'
        : myCond === 'autism' ? 'Accept_Autism'
        : 'Accept_Physical_Handicap'
      return { [acceptField]: true } as Record<string, unknown>
    }
    return {}
  }

  // Location stages
  const stages: Array<'city' | 'stateProvince' | 'country' | 'none'> = ['city', 'stateProvince', 'country', 'none']
  const bands = [5, 10, 15]

  for (const stage of stages) {
    if (results.length >= needed) break

    for (const band of bands) {
      if (results.length >= needed) break

      // Age bounds
      let ageFilter: Record<string, unknown> = {}
      if (meAge !== null) {
        const minA = meAge - band
        const maxA = meAge + band
        ageFilter = { age: { $gte: minA, $lte: maxA } }
      }

      // Build base orientation filter (mutual)
      const base: Record<string, unknown> = {
        iam: meIwant,
        Iwant: meIam,
      }

      // Stage location filter
      if (stage === 'city' && meCity) base.city = meCity
      else if (stage === 'stateProvince' && meState) base.stateProvince = meState
      else if (stage === 'country' && meCountry) base.country = meCountry
      // 'none' adds no location constraint

      const tiers: Array<1 | 2 | 3> = myCond ? [1, 2, 3] : [3] // when no condition, treat as single tier

      for (const tier of tiers) {
        if (results.length >= needed) break

        const match: Record<string, unknown> = { ...base, ...ageFilter, ...buildHealthFilter(tier) }

        // Exclude known IDs
        const excludeObjectIds = Array.from(excludeIds).map((id) => id)

        // Build pipeline with $match and $sample to randomize; limit per step conservatively
        const remaining = needed - results.length
        const sampleSize = Math.min(Math.max(remaining * 2, 20), 150)

        const pipeline: Array<Record<string, unknown>> = [
          { $match: { ...match, userId: { $nin: excludeObjectIds } } },
          { $sample: { size: sampleSize } },
          { $project: { userId: 1 } },
        ]

        const candidates = await profileCol.aggregate<{ userId: ObjectId | string }>(pipeline).toArray()
        for (const cand of candidates) {
          if (results.length >= needed) break
          const uid = typeof cand.userId === 'string' ? cand.userId : cand.userId.toString()
          if (excludeIds.has(uid)) continue
          // We only return userId here; images fetched in batch by caller
          results.push({ userId: uid, imageUrl: '' })
          excludeIds.add(uid)
        }
      }
    }
  }

  return results
}


