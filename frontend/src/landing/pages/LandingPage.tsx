import HeroSection from '../components/HeroSection'
import LowerImageSection from '../components/LowerImageSection'

export default function LandingPage() {
	return (
		<main className="landing-root">
			<HeroSection />
			<LowerImageSection imageUrl="https://publicwebassets.b-cdn.net/landing%20sec2.jpeg" />
			<LowerImageSection />
		</main>
	)
}


