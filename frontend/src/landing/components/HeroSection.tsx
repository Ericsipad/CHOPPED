import SignInButton from '../../shared/auth/SignInButton'
import SignUpButton from '../../shared/auth/SignUpButton'
import { useCallback, useState } from 'react'
import SignInDialog from '../../shared/auth/SignInDialog'
import SignUpDialog from '../../shared/auth/SignUpDialog'
type HeroSectionProps = {
	imageUrl?: string
}

export default function HeroSection(props: HeroSectionProps) {
	const { imageUrl = 'https://publicwebassets.b-cdn.net/desktop%20landing%20img%201.png' } = props
	const [showSignIn, setShowSignIn] = useState<boolean>(() => {
		try { return Boolean((window as any).CHOPPED_OPEN_SIGNIN) } catch { return false }
	})
	const [showSignUp, setShowSignUp] = useState(false)
	const handleOpenSignIn = useCallback(() => setShowSignIn(true), [])
	const handleCloseSignIn = useCallback(() => setShowSignIn(false), [])
	const handleOpenSignUp = useCallback(() => setShowSignUp(true), [])
	const handleCloseSignUp = useCallback(() => setShowSignUp(false), [])
	const handleSignedIn = useCallback(() => { window.location.replace('/account.html') }, [])
	const handleSignUpSuccess = useCallback(() => {
		setShowSignUp(false)
		setShowSignIn(true)
	}, [])
	return (
		<section className="landing-hero" aria-label="Landing top image">
			<div className="landing-container">
				<img src={imageUrl} alt="Landing" className="landing-hero-img" />
				<div className="landing-brand">
					<div>Chopped</div>
					<div>Dating</div>
				</div>
				<div className="landing-btn landing-btn-signup">
					<SignUpButton className="pill-button" onClick={handleOpenSignUp} />
				</div>
				<div className="landing-btn landing-btn-signin">
					<SignInButton className="pill-button" onClick={handleOpenSignIn} />
				</div>
				<SignInDialog open={showSignIn} onClose={handleCloseSignIn} onSuccess={handleSignedIn} />
				<SignUpDialog open={showSignUp} onClose={handleCloseSignUp} onSuccess={handleSignUpSuccess} />
			</div>
		</section>
	)
}


