/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import LandingPage from './pages/LandingPage'
import './styles/landing.css'

function DesktopGate() {
	useEffect(() => {
		const isDesktop = window.matchMedia('(min-width: 1024px)').matches
		if (!isDesktop) {
			window.location.replace('/mobile.html')
		}
		// If redirected from confirm, open sign-in dialog
		try {
			const url = new URL(window.location.href)
			if (url.searchParams.get('signedUp') === '1') {
				window.CHOPPED_OPEN_SIGNIN = true
			}
		} catch { void 0 }
	}, [])
	return <LandingPage />
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<DesktopGate />
	</StrictMode>,
)

declare global {
	interface Window { CHOPPED_OPEN_SIGNIN?: boolean }
}

export {}
