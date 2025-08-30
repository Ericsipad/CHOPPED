import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getProfileMatchingCollection, getUsersCollection } from '@/lib/mongo'

const ALLOWED_METHODS = ['GET', 'POST', 'OPTIONS'] as const

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

    const users = await getUsersCollection()
    const userDoc = await users.findOne({ supabaseUserId: user.id })
    if (!userDoc?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }

    const collection = await getProfileMatchingCollection()
    const doc = await collection.findOne<{ displayName?: string; age?: number; heightCm?: number; bio?: string; country?: string; stateProvince?: string; city?: string; locationAnswer?: string; iam?: string }>({ userId: userDoc._id })
    const displayName = typeof doc?.displayName === 'string' ? doc!.displayName : null
    const age = typeof doc?.age === 'number' ? doc!.age : null
    const heightCm = typeof doc?.heightCm === 'number' ? doc!.heightCm : null
    const bio = typeof doc?.bio === 'string' ? doc!.bio : null
    const country = typeof doc?.country === 'string' ? doc!.country : null
    const stateProvince = typeof doc?.stateProvince === 'string' ? doc!.stateProvince : null
    const city = typeof doc?.city === 'string' ? doc!.city : null
    const locationAnswer = typeof doc?.locationAnswer === 'string' ? doc!.locationAnswer : null
    const iam = typeof doc?.iam === 'string' ? doc!.iam : null

    return NextResponse.json({ displayName, age, heightCm, bio, country, stateProvince, city, locationAnswer, iam }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
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

    let { displayName, age, heightCm, bio, country, stateProvince, city, locationAnswer, iam } = rawBody as { displayName?: unknown; age?: unknown; heightCm?: unknown; bio?: unknown; country?: unknown; stateProvince?: unknown; city?: unknown; locationAnswer?: unknown; iam?: unknown }

    // Basic validation (keep simple, mirror existing style)
    if (typeof displayName !== 'string') displayName = undefined
    if (typeof age !== 'number' || !Number.isInteger(age)) age = undefined
    if (typeof heightCm !== 'number' || !Number.isInteger(heightCm)) heightCm = undefined
    if (typeof bio !== 'string') bio = undefined
    if (typeof country !== 'string') country = undefined
    if (typeof stateProvince !== 'string') stateProvince = undefined
    if (typeof city !== 'string') city = undefined
    if (typeof locationAnswer !== 'string') locationAnswer = undefined
    if (typeof iam !== 'string') iam = undefined

    if (displayName === undefined && age === undefined && heightCm === undefined && bio === undefined && country === undefined && stateProvince === undefined && city === undefined && locationAnswer === undefined && iam === undefined) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400, headers })
    }

    // Constrain values
    if (typeof displayName === 'string') {
      displayName = displayName.trim().slice(0, 60)
    }
    if (typeof age === 'number') {
      if (age < 13 || age > 120) {
        return NextResponse.json({ error: 'Invalid age' }, { status: 400, headers })
      }
    }
    if (typeof heightCm === 'number') {
      if (heightCm < 50 || heightCm > 260) {
        return NextResponse.json({ error: 'Invalid heightCm' }, { status: 400, headers })
      }
    }
    let bioStr: string | undefined
    if (typeof bio === 'string') {
      bioStr = bio.trim()
      if (bioStr.length > 500) {
        return NextResponse.json({ error: 'Invalid bio' }, { status: 400, headers })
      }
    }

    let countryStr: string | undefined
    if (typeof country === 'string') {
      countryStr = country.trim().slice(0, 80)
    }
    let stateProvinceStr: string | undefined
    if (typeof stateProvince === 'string') {
      stateProvinceStr = stateProvince.trim().slice(0, 120)
    }
    let cityStr: string | undefined
    if (typeof city === 'string') {
      cityStr = city.trim().slice(0, 160)
    }
    let locationAnswerStr: string | undefined
    if (typeof locationAnswer === 'string') {
      locationAnswerStr = locationAnswer.trim().slice(0, 260)
    }
    let iamStr: string | undefined
    if (typeof iam === 'string') {
      const trimmed = iam.trim().slice(0, 80)
      const allowed = new Set(['straight_man', 'gay_man', 'straight_woman', 'gay_woman'])
      if (!allowed.has(trimmed)) {
        return NextResponse.json({ error: 'Invalid iam' }, { status: 400, headers })
      }
      iamStr = trimmed
    }

    const users = await getUsersCollection()
    const userDoc = await users.findOne({ supabaseUserId: user.id })
    if (!userDoc?._id) {
      return NextResponse.json({ error: 'User not linked' }, { status: 400, headers })
    }

    const collection = await getProfileMatchingCollection()
    const now = new Date()
    const filter = { userId: userDoc._id }
    const update: { $setOnInsert: Record<string, unknown>; $set: Record<string, unknown> } = {
      $setOnInsert: { userId: userDoc._id, createdAt: now },
      $set: { updatedAt: now },
    }
    if (typeof displayName === 'string') update.$set.displayName = displayName
    if (typeof age === 'number') update.$set.age = age
    if (typeof heightCm === 'number') update.$set.heightCm = heightCm
    if (typeof bioStr === 'string') update.$set.bio = bioStr
    if (typeof countryStr === 'string') update.$set.country = countryStr
    if (typeof stateProvinceStr === 'string') update.$set.stateProvince = stateProvinceStr
    if (typeof cityStr === 'string') update.$set.city = cityStr
    if (typeof locationAnswerStr === 'string') update.$set.locationAnswer = locationAnswerStr
    if (typeof iamStr === 'string') update.$set.iam = iamStr

    await collection.updateOne(filter, update, { upsert: true })
    return NextResponse.json({ ok: true }, { headers })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


