import { NextResponse } from 'next/server'
 
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

export async function POST(req: Request) {
  const allowedOrigins = getAllowedOrigins()

  const requestOrigin = req.headers.get('origin')
  if (allowedOrigins.length > 0 && requestOrigin && !isOriginAllowed(requestOrigin, allowedOrigins)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers: buildCorsHeaders(allowedOrigins, null) },
    )
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }

  // Route dispatcher stub. Replace with specific handlers as needed.
  // Expected shape: { action: string, data?: any }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json(
      { error: 'Body must be a JSON object' },
      { status: 400, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }

  const { action } = payload as { action?: string; data?: unknown }

  if (!action) {
    return NextResponse.json(
      { error: 'Missing "action"' },
      { status: 400, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }

  try {
    switch (action) {
      case 'health': {
        return NextResponse.json(
          { ok: true, ts: Date.now() },
          { headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
        )
      }
      default: {
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
        )
      }
    }
  } catch {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }
}


export async function GET(req: Request) {
  const allowedOrigins = getAllowedOrigins()

  const requestOrigin = req.headers.get('origin')
  if (allowedOrigins.length > 0 && requestOrigin && !isOriginAllowed(requestOrigin, allowedOrigins)) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers: buildCorsHeaders(allowedOrigins, null) },
    )
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (!action) {
    return NextResponse.json(
      { error: 'Missing "action"' },
      { status: 400, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }

  try {
    switch (action) {
      case 'health': {
        return NextResponse.json(
          { ok: true, ts: Date.now() },
          { headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
        )
      }
      default: {
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
        )
      }
    }
  } catch {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: buildCorsHeaders(allowedOrigins, requestOrigin) },
    )
  }
}


