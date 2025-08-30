import { useState, useEffect } from 'react'
import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import SubscriptionContainer from '../components/SubscriptionContainer'
import '../styles/internal.css'
import { getBackendApi } from '../../lib/config'

export default function AccountPage() {
	const [currentSubscription, setCurrentSubscription] = useState<number>(3)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchSubscription()
	}, [])

	const fetchSubscription = async () => {
		try {
			setLoading(true)
			const response = await fetch(getBackendApi('/api/user/subscription'), {
				credentials: 'include'
			})
			if (response.ok) {
				const data = await response.json()
				setCurrentSubscription(data.subscription)
			} else {
				console.error('Failed to fetch subscription')
				setError('Failed to load subscription')
			}
		} catch (err) {
			console.error('Subscription fetch error:', err)
			setError('Failed to load subscription')
		} finally {
			setLoading(false)
		}
	}

	const handleSubscribe = async (slots: number) => {
		try {
			const response = await fetch(getBackendApi('/api/user/subscription'), {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ subscription: slots }),
			})

			if (response.ok) {
				const data = await response.json()
				setCurrentSubscription(data.subscription)
				// TODO: Integrate Stripe payment flow here
				console.log(`Successfully subscribed to ${slots} slots`)
			} else {
				const errorData = await response.json()
				setError(errorData.error || 'Failed to update subscription')
			}
		} catch (err) {
			console.error('Subscription update error:', err)
			setError('Failed to update subscription')
		}
	}

	return (
		<PageFrame>
			<div style={{ position: 'relative' }}>
				<Container>
					<HeroImage />
					<div
						style={{
							position: 'absolute',
							top: '20%',
							left: 0,
							right: 0,
							bottom: 0,
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'flex-start',
							zIndex: 9,
							padding: '0 16px',
						}}
					>
						<div style={{ width: '100%', maxWidth: '800px' }}>
							{loading ? (
								<div style={{
									color: '#ffffff',
									textAlign: 'center',
									fontSize: '18px',
									marginTop: '100px'
								}}>
									Loading subscription options...
								</div>
							) : error ? (
								<div style={{
									color: '#ff7070',
									textAlign: 'center',
									fontSize: '16px',
									marginTop: '100px',
									background: 'rgba(0,0,0,0.7)',
									padding: '20px',
									borderRadius: '12px',
									border: '1px solid rgba(255,255,255,0.1)'
								}}>
									{error}
								</div>
							) : (
								<SubscriptionContainer
									currentSubscription={currentSubscription}
									onSubscribe={handleSubscribe}
								/>
							)}
						</div>
					</div>
				</Container>
			</div>
		</PageFrame>
	)
}
