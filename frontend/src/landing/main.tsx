/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import LandingPage from './pages/LandingPage'
import usePWAInstallation from '../shared/hooks/usePWAInstallation'
import PWAInstallPrompt from '../shared/components/PWAInstallPrompt'
import './styles/landing.css'
import './styles/template.css'

function PWAAwareLanding() {
	const [showPage, setShowPage] = useState(false)
	const [showInstallPrompt, setShowInstallPrompt] = useState(false)
	const { isInstalled, canInstall, showInstallPrompt: triggerInstall, dismissPrompt } = usePWAInstallation()

	useEffect(() => {
		try {
			const url = new URL(window.location.href)
			if (url.searchParams.get('signedUp') === '1') {
				window.CHOPPED_OPEN_SIGNIN = true
			}
		} catch { void 0 }

		const isDesktop = window.matchMedia('(min-width: 1024px)').matches
		
		if (isDesktop) {
			// Desktop users get normal access
			setShowPage(true)
		} else {
			// Mobile users need PWA installed for full experience
			if (isInstalled) {
				setShowPage(true)
			} else if (canInstall) {
				// Show landing page but also prompt for PWA installation
				setShowPage(true)
				setShowInstallPrompt(true)
			} else {
				// Fallback to mobile page if PWA not available
				window.location.replace('/mobile.html')
			}
		}
	}, [isInstalled, canInstall])

	const handleInstall = () => {
		triggerInstall()
		setShowInstallPrompt(false)
	}

	const handleDismiss = () => {
		dismissPrompt()
		setShowInstallPrompt(false)
	}

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
			<PWAInstallPrompt
				isVisible={showInstallPrompt}
				onInstall={handleInstall}
				onDismiss={handleDismiss}
			/>
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
