import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import '../styles/internal.css'

export default function ProfilePage() {
	return (
		<PageFrame>
			<div>
				<Container>
					<HeroImage />
				</Container>
			</div>
		</PageFrame>
	)
}


