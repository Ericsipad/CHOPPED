import '../styles/internal.css'

const HERO_URL = 'https://publicwebassets.b-cdn.net/chopping%20page.png'

type HeroImageProps = {
	imageUrl?: string
	alt?: string
}

export default function HeroImage(props: HeroImageProps) {
	const { imageUrl = HERO_URL, alt = 'Account hero' } = props
	return (
		<section className="internal-hero" aria-label="Account top image">
			<img src={imageUrl} alt={alt} className="internal-hero-img" />
		</section>
	)
}
