import PageFrame from '../components/PageFrame'
import Container from '../components/Container'
import HeroImage from '../components/HeroImage'
import ProfileImageCard from '../components/ProfileImageCard'
import PublicProfilePanel from '../components/PublicProfilePanel'
import '../styles/internal.css'
import { useState } from 'react'
 
 
export default function ProfilePage() {
	const [activeTab, setActiveTab] = useState<'pics' | 'bio'>('pics')

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
							<div style={{ width: 'clamp(30vw, calc(-118vw + 2127px), 90vw)', maxWidth: 1100 }}>
								<div className="profile-tabs__nav">
									<button
										className={["profile-tabs__btn", activeTab === 'pics' ? 'is-active' : ''].filter(Boolean).join(' ')}
										onClick={() => setActiveTab('pics')}
										aria-pressed={activeTab === 'pics'}
									>
										Profile pics
									</button>
									<button
										className={["profile-tabs__btn", activeTab === 'bio' ? 'is-active' : ''].filter(Boolean).join(' ')}
										onClick={() => setActiveTab('bio')}
										aria-pressed={activeTab === 'bio'}
									>
										Public BIO
									</button>
								</div>
								<div className="profile-tabs__content">
									{activeTab === 'pics' ? (
										<ProfileImageCard />
									) : (
										<PublicProfilePanel />
									)}
								</div>
							</div>
						</div>
					</div>
				</Container>
			</div>
		</PageFrame>
	)
}


