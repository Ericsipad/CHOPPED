import { useEffect, useState } from 'react'
import Hero from '../components/template/Hero'
import Features from '../components/template/Features'
import Authenticity from '../components/template/Authenticity'
import Testimonials from '../components/template/Testimonials'
import Footer from '../components/template/Footer'
import SignInDialog from '../../shared/auth/SignInDialog'
import SignUpDialog from '../../shared/auth/SignUpDialog'

export default function LandingPage() {
	const [openSignIn, setOpenSignIn] = useState(false)
	const [openSignUp, setOpenSignUp] = useState(false)

	useEffect(() => {
		if (window.CHOPPED_OPEN_SIGNIN) {
			setOpenSignIn(true)
		}
	}, [])

	return (
		<main>
			<Hero onClickSignUp={() => setOpenSignUp(true)} onClickSignIn={() => { window.location.href = '/profile.html?signin=1' }} />
			<Features />
			<Authenticity />
			<Testimonials />
			<Footer />
			<SignInDialog open={openSignIn} onClose={() => setOpenSignIn(false)} onSuccess={() => window.location.href = '/profile.html'} />
			<SignUpDialog open={openSignUp} onClose={() => setOpenSignUp(false)} />
		</main>
	)
}

