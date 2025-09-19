/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ProfilePage from '../pages/ProfilePage'
import usePWAInstallation from '../../shared/hooks/usePWAInstallation'
import PWAInstallPrompt from '../../shared/components/PWAInstallPrompt'
import '../styles/internal.css'
import { useAuth } from '../hooks/useAuth'
import SignInDialog from '../../shared/auth/SignInDialog'

function PWAAwareGate() {
	const [showPage, setShowPage] = useState(false)
	const [showInstallPrompt, setShowInstallPrompt] = useState(false)
	const [openSignIn, setOpenSignIn] = useState(false)
	const { isInstalled, canInstall, showInstallPrompt: triggerInstall, dismissPrompt } = usePWAInstallation()
	const { isAuthenticated, loading } = useAuth()

	// Apply and react to internal background mode (default: light)
	useEffect(() => {
		const root = document.getElementById('root')
		if (!root) return
		const stored = localStorage.getItem('internal_background_mode')
		if (!stored) {
			localStorage.setItem('internal_background_mode', 'light')
		}
		const apply = (mode: string | null) => {
			root.classList.toggle('internal-bg--light', mode === 'light')
		}
		apply(localStorage.getItem('internal_background_mode'))
		const onChange = (e: any) => {
			const mode = e?.detail?.mode as string | undefined
			if (mode === 'light' || mode === 'dark') {
				apply(mode)
			}
		}
		window.addEventListener('internal-background-change', onChange)
		return () => window.removeEventListener('internal-background-change', onChange)
	}, [])

	const shouldOpenSigninFromQuery = useMemo(() => {
		try {
			const url = new URL(window.location.href)
			return url.searchParams.get('signin') === '1'
		} catch { return false }
	}, [])
	
	useEffect(() => {
		if (loading) return

		// If explicitly requested, force open sign-in first and skip gating/redirects
		if (shouldOpenSigninFromQuery) {
			setOpenSignIn(true)
			return
		}

		if (!isAuthenticated) {
			setOpenSignIn(true)
			return
		}

		const isDesktop = window.matchMedia('(min-width: 1024px)').matches
		if (isDesktop) {
			setShowPage(true)
			return
		}



		// Mobile: show page only if installed; if prompt available show it; otherwise redirect to mobile install page
		if (isInstalled) {
			setShowPage(true)
			setShowInstallPrompt(false)
		} else if (canInstall) {
			setShowPage(false)
			setShowInstallPrompt(true)
		} else {
			window.location.replace('/mobile.html')
		}
	}, [loading, isAuthenticated, isInstalled, canInstall, shouldOpenSigninFromQuery])

	const handleInstall = () => {
		triggerInstall()
		setShowInstallPrompt(false)
	}

	const handleDismiss = () => {
		dismissPrompt()
		setShowInstallPrompt(false)
	}

	const handleSigninSuccess = () => {
		setOpenSignIn(false)
		window.location.href = '/profile.html'
	}

	if (!showPage && !showInstallPrompt) {
		return (
			<>
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
				<SignInDialog open={openSignIn || shouldOpenSigninFromQuery} onClose={() => setOpenSignIn(false)} onSuccess={handleSigninSuccess} />
			</>
		)
	}

	return (
		<>
			{showPage && <ProfilePage />}
			<SignInDialog open={openSignIn || shouldOpenSigninFromQuery} onClose={() => setOpenSignIn(false)} onSuccess={handleSigninSuccess} />
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
