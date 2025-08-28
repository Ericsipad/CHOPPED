import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token_hash = url.searchParams.get('token_hash') || url.searchParams.get('token')
  const rawType = (url.searchParams.get('type') || 'email').toLowerCase()
  const code = url.searchParams.get('code')
  const supabase = createSupabaseRouteClient()

  function getFrontendBase(): string {
    const envFront = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || ''
    return (envFront || '').replace(/\/+$/g, '')
  }

  // Support both flows: PKCE code (exchange) or token_hash (verifyOtp)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      const base = getFrontendBase()
      const redirect = base ? `${base}/?auth_error=exchange_failed` : new URL('/auth/error?reason=exchange_failed', req.url)
      return NextResponse.redirect(redirect as any)
    }
  } else {
    if (!token_hash) {
      const base = getFrontendBase()
      const redirect = base ? `${base}/?auth_error=missing_token` : new URL('/auth/error?reason=missing_token', req.url)
      return NextResponse.redirect(redirect as any)
    }
    const emailOtpTypes = ['email', 'recovery', 'email_change', 'magiclink', 'signup'] as const
    type EmailOtpType = typeof emailOtpTypes[number]
    function coerceType(t: string): EmailOtpType {
      // Supabase may send type=signup for email confirm; treat as 'email'
      if (t === 'signup') return 'email'
      return (emailOtpTypes as readonly string[]).includes(t as any) ? (t as EmailOtpType) : 'email'
    }
    const otpType = coerceType(rawType)
    const { error } = await supabase.auth.verifyOtp({ type: otpType as any, token_hash })
    if (error) {
      const base = getFrontendBase()
      const redirect = base ? `${base}/?auth_error=verify_failed` : new URL('/auth/error?reason=verify_failed', req.url)
      return NextResponse.redirect(redirect as any)
    }
  }
  // Link Mongo and Supabase IDs on verification (server-side, once)
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id) {
    const users = await getUsersCollection()
    const now = new Date()
    await users.updateOne(
      { supabaseUserId: user.id },
      { $setOnInsert: { createdAt: now, supabaseUserId: user.id }, $set: { updatedAt: now } },
      { upsert: true },
    )
    const doc = await users.findOne({ supabaseUserId: user.id })
    const mongoIdString = doc?._id?.toString()
    if (mongoIdString) {
      await supabase.auth.updateUser({ data: { mongoUserId: mongoIdString } })
    }
  }
  const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || '').replace(/\/+$/g, '')
  const successRedirect = frontendUrl ? `${frontendUrl}/?signedUp=1` : new URL('/', req.url)
  return NextResponse.redirect(successRedirect as any)
}


