import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/utils/supabase/server'
import { getUsersCollection } from '@/lib/mongo'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token_hash = url.searchParams.get('token_hash')
  const type = url.searchParams.get('type') || 'email'
  if (!token_hash) {
    return NextResponse.redirect(new URL('/auth/error?reason=missing_token', req.url))
  }
  const supabase = createSupabaseRouteClient()
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
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email) {
    const users = await getUsersCollection()
    const now = new Date()
    await users.updateOne(
      { email: user.email },
      { $setOnInsert: { createdAt: now }, $set: { supabaseUserId: user.id, updatedAt: now } },
      { upsert: true },
    )
  }
  const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL
  return NextResponse.redirect(`${frontendUrl || ''}/account`)
}


