type HeroSectionProps = {
	imageUrl?: string
}

export default function HeroSection(props: HeroSectionProps) {
	const { imageUrl = 'https://publicwebassets.b-cdn.net/Gemini_Generated_Image_jw22ljw22ljw22lj.png' } = props
	return (
		<section className="landing-hero" aria-label="Landing top image">
			<img src={imageUrl} alt="Landing" className="landing-hero-img" />
		</section>
	)
}


