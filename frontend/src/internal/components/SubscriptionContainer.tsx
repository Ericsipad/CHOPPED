import { useState } from 'react'

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
  onSubscribe: (slots: number) => void
}

export default function SubscriptionContainer({ currentSubscription, onSubscribe }: SubscriptionContainerProps) {
  const [loading, setLoading] = useState<number | null>(null)

  const handleSubscribe = async (slots: number) => {
    setLoading(slots)
    try {
      // TODO: Integrate with Stripe later
      console.log(`Subscribing to ${slots} slots`)
      onSubscribe(slots)
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="subscription-grid">
      {SUBSCRIPTION_PLANS.map((plan) => {
        const isCurrent = currentSubscription === plan.slots

        return (
          <div
            key={plan.slots}
            className={`subscription-container ${isCurrent ? 'is-selected' : ''}`}
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
              <button
                className="subscription-button"
                onClick={() => handleSubscribe(plan.slots)}
                disabled={loading === plan.slots || isCurrent}
              >
                {loading === plan.slots ? 'Processing...' : isCurrent ? 'Current Plan' : 'Subscribe'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
