import SignInButton from '../../shared/auth/SignInButton'
import SignUpButton from '../../shared/auth/SignUpButton'
import React, { useCallback, useState } from 'react'
import SignInDialog from '../../shared/auth/SignInDialog'
type HeroSectionProps = {
	imageUrl?: string
}

export default function HeroSection(props: HeroSectionProps) {
	const { imageUrl = 'https://publicwebassets.b-cdn.net/desktop%20landing%20img%201.png' } = props
	const [showSignIn, setShowSignIn] = useState(false)
	const handleOpenSignIn = useCallback(() => setShowSignIn(true), [])
	const handleCloseSignIn = useCallback(() => setShowSignIn(false), [])
	const handleSignedIn = useCallback(() => { window.location.replace('/account.html') }, [])
	return (
		<section className="landing-hero" aria-label="Landing top image">
			<div className="landing-container">
				<img src={imageUrl} alt="Landing" className="landing-hero-img" />
				<div className="landing-brand">
					<div>Chopped</div>
					<div>Dating</div>
				</div>
				<div className="landing-btn landing-btn-signup">
					<SignUpButton className="pill-button" />
				</div>
				<div className="landing-btn landing-btn-signin">
					<SignInButton className="pill-button" onClick={handleOpenSignIn} />
				</div>
				<SignInDialog open={showSignIn} onClose={handleCloseSignIn} onSuccess={handleSignedIn} />
			</div>
		</section>
	)
}


