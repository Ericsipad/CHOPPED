import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'

function buildCorsHeaders(origin: string | null) {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  const allow = origin && allowed.includes(origin) ? origin : 'null'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin')
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) })
}

export async function GET(req: Request) {
  const origin = req.headers.get('origin')
  try {
    const supabase = createSupabaseRouteClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401, headers: buildCorsHeaders(origin) })
    }
    return NextResponse.json({ user }, { headers: buildCorsHeaders(origin) })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers: buildCorsHeaders(origin) })
  }
}


