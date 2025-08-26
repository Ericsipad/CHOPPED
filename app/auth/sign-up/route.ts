import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseRouteClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  const allowedOrigin = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) || []
  const origin = req.headers.get('origin')
  const headers = {
    'Access-Control-Allow-Origin': origin && allowedOrigin.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
  try {
    const body = await req.json()
    const schema = z.object({ email: z.string().email(), password: z.string().min(8) })
    const { email, password } = schema.parse(body)
    const supabase = createSupabaseRouteClient()
    const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL
    const emailRedirectTo = `${frontendUrl || ''}/account`
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo } })
    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers })
    return NextResponse.json({ ok: true, message: 'Please check your email for the verification link to log in.' }, { headers })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid payload' }, { status: 400, headers })
  }
}

export async function OPTIONS(req: Request) {
  const allowedOrigin = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()) || []
  const origin = req.headers.get('origin')
  const headers = {
    'Access-Control-Allow-Origin': origin && allowedOrigin.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  }
  return new NextResponse(null, { status: 204, headers })
}


