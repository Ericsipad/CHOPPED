type LowerImageSectionProps = {
	imageUrl?: string
}

export default function LowerImageSection(props: LowerImageSectionProps) {
	const { imageUrl = 'https://publicwebassets.b-cdn.net/desktop%20landing%202.png' } = props
	return (
		<section className="landing-lower" aria-label="Landing lower image">
			<img src={imageUrl} alt="Landing lower" className="landing-lower-img" />
		</section>
	)
}


