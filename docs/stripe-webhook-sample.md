# Stripe webhook sample (reference only)

This minimal Express + Stripe example is for local testing with the Stripe CLI. Do not hardcode secrets; use environment variables. Production uses our Next.js route at `/api/stripe/webhook` with signature verification.

```js
// server.js (reference only)
// 1) npm install stripe express
// 2) node server.js (http://localhost:4242)

const express = require('express')
const Stripe = require('stripe')

// Never hardcode secrets. Set:
//   STRIPE_SECRET_KEY=sk_test_...
//   STRIPE_WEBHOOK_SECRET=whsec_...
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

const app = express()
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed.', err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      // handle checkout completion
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object
      // handle subscription deleted
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object
      // handle payment failed
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      // handle payment succeeded
      break
    }
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.send()
})

app.listen(4242, () => console.log('Running on port 4242'))
```

Notes
- Use `stripe listen --forward-to http://localhost:4242/webhook` for local testing.
- In production, configure Stripe to call `https://YOUR-BACKEND-DOMAIN/api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET` accordingly.
