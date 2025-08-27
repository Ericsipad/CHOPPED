type HeroSectionProps = {
	imageUrl?: string
}

export default function HeroSection(props: HeroSectionProps) {
	const { imageUrl = 'https://publicwebassets.b-cdn.net/desktop%20landing%20img%201.png' } = props
	return (
		<section className="landing-hero" aria-label="Landing top image">
			<div className="landing-container">
				<img src={imageUrl} alt="Landing" className="landing-hero-img" />
			</div>
		</section>
	)
}


