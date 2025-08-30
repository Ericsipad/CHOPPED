import { NextResponse } from 'next/server'
import { getMapsetCollection } from '@/lib/mongo'

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

type MinimalDataset = {
  countries: Array<{ code: string; name: string }>
  statesByCountry: Record<string, Array<{ code: string; name: string }>>
  citiesByState: Record<string, Array<{ name: string }>>
}

async function loadOrCreateDataset(): Promise<MinimalDataset> {
  const collection = await getMapsetCollection()
  const key = 'world-locations-v1'
  const existing = await collection.findOne<{ key: string; data: MinimalDataset }>({ key })
  if (existing?.data) {
    return existing.data
  }

  // Reputable open JSON source: dr5hn/countries-states-cities-database
  const url = 'https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/countries%2Bstates%2Bcities.json'
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error('Failed to fetch MAPSET dataset')
  }
  const raw = await res.json() as Array<{
    name: string
    iso2?: string
    states?: Array<{ name: string; state_code?: string; cities?: Array<{ name: string }> }>
  }>

  const countries: Array<{ code: string; name: string }> = []
  const statesByCountry: Record<string, Array<{ code: string; name: string }>> = {}
  const citiesByState: Record<string, Array<{ name: string }>> = {}

  for (const c of raw) {
    const code = (c.iso2 || '').trim()
    const name = (c.name || '').trim()
    if (!name) continue
    countries.push({ code, name })
    const statesArr: Array<{ code: string; name: string }> = []
    for (const s of c.states || []) {
      const scode = (s.state_code || '').trim()
      const sname = (s.name || '').trim()
      if (!sname) continue
      statesArr.push({ code: scode, name: sname })
      const keyState = `${code}__${scode || sname}`
      const cityList = (s.cities || []).map((x) => ({ name: (x.name || '').trim() })).filter((x) => !!x.name)
      if (cityList.length > 0) {
        citiesByState[keyState] = cityList
      }
    }
    if (statesArr.length > 0) {
      statesByCountry[code || name] = statesArr
    }
  }

  const data: MinimalDataset = { countries, statesByCountry, citiesByState }
  await collection.updateOne(
    { key },
    { $set: { key, data, updatedAt: new Date() } },
    { upsert: true },
  )
  return data
}

export async function GET(req: Request) {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = req.headers.get('origin')
  const headers = buildCorsHeaders(allowedOrigins, requestOrigin)
  try {
    const data = await loadOrCreateDataset()
    return NextResponse.json(data, { headers })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}


