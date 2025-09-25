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
            className={[isCurrent ? "is-selected" : "", compact ? "subscription-container--compact" : ""].filter(Boolean).join(" ")}
            style={{ 
              // Enhanced glass effects with more blur and better background
              background: 'rgba(18,18,18,0.6)',
              backdropFilter: 'blur(20px) saturate(150%)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
              padding: compact ? '18px' : '28px',
              color: '#ffffff',
              border: isCurrent ? '2px solid rgba(76, 255, 137, 0.9)' : '1px solid rgba(255,255,255,0.08)',
              boxShadow: isCurrent ? '0 0 0 2px rgba(76, 255, 137, 0.5), 0 0 18px rgba(76, 255, 137, 0.45), 0 24px 60px rgba(0,0,0,0.6)' : '0 24px 60px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset'
            }}
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
                onClick={() => handleSubscribe(plan.slots)}
                disabled={loading === plan.slots || isCurrent}
                style={{
                  // Override existing button styles
                  background: 'transparent',
                  minWidth: compact ? 'auto' : '100px',
                  padding: compact ? '8px 12px' : '10px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  opacity: loading === plan.slots || isCurrent ? 0.6 : 1,
                  cursor: loading === plan.slots || isCurrent ? 'default' : 'pointer'
                }}
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
