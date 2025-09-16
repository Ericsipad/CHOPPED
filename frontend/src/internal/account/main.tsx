/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import AccountPage from '../pages/AccountPage'
import usePWAInstallation from '../../shared/hooks/usePWAInstallation'
import PWAInstallPrompt from '../../shared/components/PWAInstallPrompt'
import '../styles/internal.css'
import { useAuth } from '../hooks/useAuth'

function PWAAwareGate() {
	const [showPage, setShowPage] = useState(false)
	const [showInstallPrompt, setShowInstallPrompt] = useState(false)
	const { isInstalled, canInstall, showInstallPrompt: triggerInstall, dismissPrompt } = usePWAInstallation()
	const { isAuthenticated, loading } = useAuth()
	
	useEffect(() => {
		if (loading) return

		if (!isAuthenticated) {
			window.location.replace('/')
			return
		}

		const isDesktop = window.matchMedia('(min-width: 1024px)').matches
		if (isDesktop) {
			setShowPage(true)
			return
		}

		if (isInstalled) {
			setShowPage(true)
		} else if (canInstall) {
			setShowInstallPrompt(true)
		} else {
			window.location.replace('/mobile.html')
		}
	}, [loading, isAuthenticated, isInstalled, canInstall])

	const handleInstall = () => {
		triggerInstall()
		setShowInstallPrompt(false)
	}

	const handleDismiss = () => {
		dismissPrompt()
		setShowInstallPrompt(false)
		// Redirect to mobile page after dismissal
		window.location.replace('/mobile.html')
	}

	if (!showPage && !showInstallPrompt) {
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
			{showPage && <AccountPage />}
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
		<PWAAwareGate />
	</StrictMode>
)

export {}