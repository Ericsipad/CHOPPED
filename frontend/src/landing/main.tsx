/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import LandingPage from './pages/LandingPage'
import './styles/landing.css'
import './styles/template.css'


function LandingEntry() {
	useEffect(() => {
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
		<LandingEntry />
	</StrictMode>,
)

declare global {
	interface Window { CHOPPED_OPEN_SIGNIN?: boolean }
}

export {}
