/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ChoppingBoardPage from '../pages/ChoppingBoardPage'
import usePWAInstallation from '../../shared/hooks/usePWAInstallation'
import PWAInstallPrompt from '../../shared/components/PWAInstallPrompt'
import '../styles/internal.css'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'
import { useAuth } from '../hooks/useAuth'

function PWAAwareGate() {
	const [showPage, setShowPage] = useState(false)
	const [showInstallPrompt, setShowInstallPrompt] = useState(false)
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
			root.classList.remove('internal-bg--light', 'internal-bg--dark')
			if (mode === 'light') {
				root.classList.add('internal-bg--light')
			} else if (mode === 'dark') {
				root.classList.add('internal-bg--dark')
			}
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
	
	useEffect(() => {
		if (loading) return


		if (!isAuthenticated) {
			const isDesktop = window.matchMedia('(min-width: 1024px)').matches
			window.location.replace(isDesktop ? '/' : '/mobile.html')
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
	}, [loading, isAuthenticated, isInstalled, canInstall])

	const handleInstall = () => {
		triggerInstall()
		setShowInstallPrompt(false)
	}

	const handleDismiss = () => {
		dismissPrompt()
		setShowInstallPrompt(false)
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
			{showPage && <ChoppingBoardPage />}
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
		<ChakraProvider value={defaultSystem}>
			<PWAAwareGate />
		</ChakraProvider>
	</StrictMode>
)


export {}
