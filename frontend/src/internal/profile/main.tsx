/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import ProfilePage from '../pages/ProfilePage'
import '../styles/internal.css'

function DesktopGate() {
	useEffect(() => {
		const isDesktop = window.matchMedia('(min-width: 1024px)').matches
		if (!isDesktop) {
			window.location.replace('/mobile.html')
		}
	}, [])
	return <ProfilePage />
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<DesktopGate />
	</StrictMode>
)


export {}
