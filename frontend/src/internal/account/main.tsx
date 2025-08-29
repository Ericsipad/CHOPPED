/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import AccountPage from '../pages/AccountPage'
import '../styles/internal.css'

function DesktopGate() {
	useEffect(() => {
		const isDesktop = window.matchMedia('(min-width: 1024px)').matches
		if (!isDesktop) {
			window.location.replace('/mobile.html')
		}
	}, [])
	return <AccountPage />
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<DesktopGate />
	</StrictMode>
)

export {}