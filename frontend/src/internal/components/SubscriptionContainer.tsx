import { useState } from 'react'
import { getBackendApi } from '../../lib/config'
import { GlassContainer } from '../../shared/components/GlassContainer'
import { GlassButton } from '../../shared/components/GlassButton'

type SubscriptionPlan = {
  slots: number
  price: number | null // null for FREE
  description: string
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { slots: 3, price: null, description: '# profile slots are available for chatting' },
  { slots: 10, price: 10, description: 'profile slots are available for chatting' },
  { slots: 20, price: 20, description: 'profile slots are available for chatting' },
  { slots: 50, price: 40, description: 'profile slots are available for chatting' },
]

type SubscriptionContainerProps = {
  currentSubscription: number
  onlyPaid?: boolean
  compact?: boolean
}

export default function SubscriptionContainer({ currentSubscription, onlyPaid, compact }: SubscriptionContainerProps) {
  const [loading, setLoading] = useState<number | null>(null)

  const handleSubscribe = async (slots: number) => {
    setLoading(slots)
    try {
      const backend = getBackendApi('/api/billing/checkout')
      const res = await fetch(backend, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: slots }),
      })
      if (!res.ok) {
        console.error('Checkout session creation failed')
        return
      }
      const data = await res.json() as { url?: string }
      if (data.url) {
        window.location.replace(data.url)
        return
      }
      console.error('No checkout URL returned')
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(null)
    }
  }

  const plans = onlyPaid ? SUBSCRIPTION_PLANS.filter(p => p.price !== null) : SUBSCRIPTION_PLANS

  return (
    <div className={["subscription-grid", compact ? "subscription-grid--compact" : ""].filter(Boolean).join(" ") }>
      {plans.map((plan) => {
        const isCurrent = currentSubscription === plan.slots

        return (
          <GlassContainer
            key={plan.slots}
            variant="card"
            className={["subscription-container", isCurrent ? "is-selected" : "", compact ? "subscription-container--compact" : ""].filter(Boolean).join(" ")}
          >
            <div className="subscription-content">
              <div className="subscription-number">{plan.slots}</div>
              <div className="subscription-text">
                {plan.slots === 3 ? '#' : plan.slots} {plan.description}
              </div>
              <div className="subscription-price">
                {plan.price === null ? (
                  <span className="subscription-free">FREE</span>
                ) : (
                  <span className="subscription-amount">${plan.price}</span>
                )}
              </div>
            </div>
            <div className="subscription-button-container">
              <GlassButton
                variant="primary"
                className="subscription-button"
                onClick={() => handleSubscribe(plan.slots)}
                disabled={loading === plan.slots || isCurrent}
              >
                {loading === plan.slots ? 'Processing...' : isCurrent ? 'Current Plan' : 'Subscribe'}
              </GlassButton>
            </div>
          </GlassContainer>
        )
      })}
    </div>
  )
}
