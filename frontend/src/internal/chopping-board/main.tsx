/* eslint-disable react-refresh/only-export-components */
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import ChoppingBoardPage from '../pages/ChoppingBoardPage'
import '../styles/internal.css'
import { ChakraProvider, defaultSystem } from '@chakra-ui/react'

function DesktopGate() {
	useEffect(() => {
		const isDesktop = window.matchMedia('(min-width: 1024px)').matches
		if (!isDesktop) {
			window.location.replace('/mobile.html')
		}
	}, [])
	return <ChoppingBoardPage />
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ChakraProvider value={defaultSystem}>
			<DesktopGate />
		</ChakraProvider>
	</StrictMode>
)


export {}
