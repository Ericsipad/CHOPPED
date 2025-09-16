/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import LandingPage from './pages/LandingPage'
// PWA install prompt intentionally not shown on landing
import './styles/landing.css'
import './styles/template.css'

function PWAAwareLanding() {
	const [showPage, setShowPage] = useState(false)

	useEffect(() => {
		try {
			const url = new URL(window.location.href)
			if (url.searchParams.get('signedUp') === '1') {
				window.CHOPPED_OPEN_SIGNIN = true
			}
		} catch { void 0 }

		// Always show landing; do not gate or prompt for PWA here
		setShowPage(true)
	}, [])

	if (!showPage) {
		return (
			<div style={{ 
				display: 'flex', 
				alignItems: 'center', 
				justifyContent: 'center', 
				height: '100vh',
				color: 'white',
				fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
			}}>
				Loading...
			</div>
		)
	}

	return (
		<>
			<LandingPage />
		</>
	)
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<PWAAwareLanding />
	</StrictMode>,
)

declare global {
	interface Window { CHOPPED_OPEN_SIGNIN?: boolean }
}

export {}
