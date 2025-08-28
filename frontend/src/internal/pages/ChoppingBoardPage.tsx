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
					<div style={{ position: 'relative' }}>
						<HeroImage />
						<div
							style={{
								position: 'absolute',
								top: 48, // keep clear of the 48px header so nav remains clickable
								left: 0,
								right: 0,
								bottom: 0,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								zIndex: 9,
							}}
						>
							<ProfileGrid images={images} />
						</div>
					</div>
				</Container>
			</div>
		</PageFrame>
	)
}


