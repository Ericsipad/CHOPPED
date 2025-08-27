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
	}, [])
	return <LandingPage />
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<DesktopGate />
	</StrictMode>,
)


