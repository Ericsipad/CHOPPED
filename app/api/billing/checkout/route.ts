import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUsersCollection } from '@/lib/mongo'
import { createSupabaseRouteClient } from '@/utils/supabase/server'

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

type CheckoutBody = { plan: 10 | 20 | 50 }

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

    const body = (await req.json()) as Partial<CheckoutBody>
    const plan = body?.plan
    if (plan !== 10 && plan !== 20 && plan !== 50) {
      return NextResponse.json({ error: 'Invalid plan. Must be 10, 20, or 50.' }, { status: 400, headers })
    }

    const stripeSecret = process.env.STRIPE_SECRET_KEY
    if (!stripeSecret) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500, headers })
    }
    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-11-20.acacia' })

    const priceMap: Record<string, number> = {
      [process.env.STRIPE_PRICE_10 || '']: 10,
      [process.env.STRIPE_PRICE_20 || '']: 20,
      [process.env.STRIPE_PRICE_50 || '']: 50,
    }
    const inversePriceMap: Record<10 | 20 | 50, string | undefined> = {
      10: process.env.STRIPE_PRICE_10,
      20: process.env.STRIPE_PRICE_20,
      50: process.env.STRIPE_PRICE_50,
    }
    const priceId = inversePriceMap[plan]
    if (!priceId) {
      return NextResponse.json({ error: 'Missing Stripe price ID for selected plan' }, { status: 500, headers })
    }

    const users = await getUsersCollection()
    const now = new Date()
    // Ensure user doc exists (idempotent)
    await users.updateOne(
      { supabaseUserId: user.id },
      { $setOnInsert: { supabaseUserId: user.id, createdAt: now }, $set: { updatedAt: now } },
      { upsert: true },
    )
    const userDoc = await users.findOne({ supabaseUserId: user.id })
    if (!userDoc?._id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers })
    }

    // Ensure Stripe customer
    let stripeCustomerId: string | undefined = userDoc.stripeCustomerId
    if (!stripeCustomerId) {
      const created = await stripe.customers.create({
        email: (user as { email?: string }).email,
        metadata: {
          supabaseUserId: user.id,
          mongoUserId: userDoc._id.toString(),
        },
      })
      stripeCustomerId = created.id
      await users.updateOne(
        { _id: userDoc._id },
        { $set: { stripeCustomerId, updatedAt: new Date() } },
      )
    }

    const frontendUrl = (process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || '').replace(/\/+$/g, '')
    if (!frontendUrl) {
      return NextResponse.json({ error: 'Frontend URL not configured' }, { status: 500, headers })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [
        { price: priceId, quantity: 1 },
      ],
      success_url: `${frontendUrl}/account.html?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/account.html?checkout=cancel`,
      client_reference_id: user.id,
      metadata: {
        supabaseUserId: user.id,
        mongoUserId: userDoc._id.toString(),
        requestedPlan: String(plan),
      },
      allow_promotion_codes: false,
      subscription_data: {
        metadata: {
          supabaseUserId: user.id,
          mongoUserId: userDoc._id.toString(),
        },
      },
    })

    return NextResponse.json({ url: session.url }, { headers })
  } catch (error) {
    console.error('Checkout POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


