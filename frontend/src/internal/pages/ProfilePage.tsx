import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import ProfileImageCard from '../components/ProfileImageCard'
import '../styles/internal.css'

export default function ProfilePage() {
	return (
		<PageFrame>
			<div>
				<Container>
					<div style={{ position: 'relative' }}>
						<HeroImage />
						<div
							style={{
								position: 'absolute',
								top: '15%',
								left: 0,
								right: 0,
								bottom: 0,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'flex-start',
								zIndex: 9,
							}}
						>
							<ProfileImageCard />
						</div>
					</div>
				</Container>
			</div>
		</PageFrame>
	)
}


