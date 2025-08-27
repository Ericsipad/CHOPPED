type HeroSectionProps = {
	imageUrl?: string
}

export default function HeroSection(props: HeroSectionProps) {
	const { imageUrl = 'https://publicwebassets.b-cdn.net/landing%20desktop.png' } = props
	return (
		<section className="landing-hero" aria-label="Landing top image">
			<img src={imageUrl} alt="Landing" className="landing-hero-img" />
		</section>
	)
}


