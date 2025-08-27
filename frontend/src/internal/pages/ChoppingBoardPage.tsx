import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import '../styles/internal.css'

export default function ChoppingBoardPage() {
	return (
		<PageFrame>
			{/* Offset content by header height so image starts under the overlay header without gap */}
			<div style={{ paddingTop: 48 }}>
				<Container>
					<HeroImage />
				</Container>
			</div>
		</PageFrame>
	)
}


