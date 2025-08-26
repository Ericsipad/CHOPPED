import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') || 'email'
  const code = url.searchParams.get('code')
  const supabase = createSupabaseRouteClient()
  // Support both flows: PKCE code (exchange) or token_hash (verifyOtp)
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      return NextResponse.redirect(new URL('/auth/error?reason=exchange_failed', req.url))
    }
  } else {
    if (!token_hash) {
      return NextResponse.redirect(new URL('/auth/error?reason=missing_token', req.url))
    }
    const emailOtpTypes = ['email', 'recovery', 'email_change', 'magiclink'] as const
    type EmailOtpType = typeof emailOtpTypes[number]
    function isEmailOtpType(t: string): t is EmailOtpType {
      return (emailOtpTypes as readonly string[]).includes(t)
    }
    const otpType: EmailOtpType = isEmailOtpType(type) ? type : 'email'
    const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash })
    if (error) {
      return NextResponse.redirect(new URL('/auth/error?reason=verify_failed', req.url))
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
  const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL
  return NextResponse.redirect(`${frontendUrl || ''}/account`)
}


