import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import ProfileGrid from '../components/ProfileGrid'
import '../styles/internal.css'

export default function ChoppingBoardPage() {
	// Fixed filler images for wobble cards (2x5 grid)
	const images = new Array(10).fill(null).map((_, i) => ({
		url: `https://picsum.photos/seed/chopped-${i}/600/600`,
		alt: `profile ${i + 1}`,
	}))
	return (
		<PageFrame>
			<div>
				<Container>
					<HeroImage />
					<div style={{ position: 'relative', marginTop: 16 }}>
						<ProfileGrid images={images} />
					</div>
				</Container>
			</div>
		</PageFrame>
	)
}


