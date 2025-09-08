import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUsersCollection } from '@/lib/mongo'

// Webhooks must receive the raw body; Next.js route handlers do this when using runtime=nodejs and reading req.text()

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
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

function mapPlanFromInvoice(invoice: Stripe.Invoice): 10 | 20 | 50 | 3 {
  const line = invoice.lines?.data?.[0]
  const unitAmount = line?.price?.unit_amount ?? null
  if (unitAmount === 1000) return 10
  if (unitAmount === 2000) return 20
  if (unitAmount === 5000) return 50
  // Unknown → fallback to free
  return 3
}

export async function POST(req: Request) {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = req.headers.get('origin')
  const headers = buildCorsHeaders(allowedOrigins, requestOrigin)

  const stripeSecret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeSecret || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500, headers })
  }
  const stripe = new Stripe(stripeSecret)

  let event: Stripe.Event
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature') as string
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed.', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400, headers })
  }

  try {
    const users = await getUsersCollection()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.customer && typeof session.customer === 'string') {
          const stripeCustomerId = session.customer
          // Attach to user if missing
          await users.updateOne(
            { stripeCustomerId },
            { $setOnInsert: { stripeCustomerId } },
            { upsert: true },
          )
        }
        break
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
        if (!customerId) break

        const plan = mapPlanFromInvoice(invoice)
        const amountCents = invoice.amount_paid ?? 0
        const currency = invoice.currency || 'usd'
        const paidAt = new Date((invoice.created || Math.floor(Date.now() / 1000)) * 1000)
        const invoiceId = invoice.id
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : ''

        await users.updateOne(
          { stripeCustomerId: customerId },
          {
            $set: {
              subscription: plan,
              subscriptionUpdatedAt: new Date(),
              updatedAt: new Date(),
            },
            $push: {
              paymentHistory: {
                amountCents,
                currency,
                paidAt,
                invoiceId,
                subscriptionId,
              },
            },
          },
          { upsert: false },
        )
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
        if (!customerId) break
        // No grace period: immediately set to free (3)
        await users.updateOne(
          { stripeCustomerId: customerId },
          { $set: { subscription: 3, subscriptionUpdatedAt: new Date(), updatedAt: new Date() } },
        )
        break
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.canceled': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : null
        if (!customerId) break
        await users.updateOne(
          { stripeCustomerId: customerId },
          { $set: { subscription: 3, subscriptionUpdatedAt: new Date(), updatedAt: new Date() } },
        )
        break
      }
      default:
        break
    }

    return NextResponse.json({ received: true }, { headers })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500, headers })
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'



