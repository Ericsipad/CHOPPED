import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseRouteClient } from '@/utils/supabase/server'

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
    const forwardedProto = req.headers.get('x-forwarded-proto')
    const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host')
    if (!forwardedProto || !forwardedHost) {
      return NextResponse.json({ error: 'Missing forwarded headers' }, { status: 500, headers })
    }
    const backendBaseUrl = `${forwardedProto}://${forwardedHost}`.replace(/\/+$/g, '')
    const emailRedirectTo = `${backendBaseUrl}/auth/confirm`
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers })
    return NextResponse.json({ ok: true, message: 'Please check your email for the verification link to log in.', emailRedirectTo }, { headers })
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


